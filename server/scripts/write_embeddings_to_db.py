#!/usr/bin/env python3
"""Backfill chunk.embeddings in Postgres from the persisted FAISS store.

Usage:
  python server/scripts/write_embeddings_to_db.py [--dry-run]

Expect the following env vars to be present:
  DATABASE_URL           Postgres connection string
  VECTOR_DB_DATA_DIR     (optional) path where vector_store* artifacts live. Defaults to server/data.
"""

import os
import sys
import json
import pickle
from pathlib import Path
from typing import Tuple

import psycopg2
import psycopg2.extras

# Allow `import services.vector_db`
ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.append(str(ROOT))

# Import VectorDatabase from the project package (server.services)
from server.services.vector_db import VectorDatabase  # noqa: E402


def load_vector_db() -> VectorDatabase:
    """Load the persisted FAISS/embedding store from disk."""
    data_dir = Path(os.getenv("VECTOR_DB_DATA_DIR", ROOT / "server" / "data"))
    persistence_base = data_dir / "vector_store"
    vdb = VectorDatabase()
    vdb.load_from_file(str(persistence_base))
    if not vdb.vectors:
        print("[warn] Loaded vector DB contains 0 vectors – did you persist after indexing?", file=sys.stderr)
    else:
        print(f"Loaded {len(vdb.vectors):,} vectors from {persistence_base}")
    return vdb


def fetch_null_chunks(cur) -> Tuple[int, list]:
    sql = """
        SELECT c.id, v.youtube_id, c.chunk_index
        FROM chunks c
        JOIN videos v ON v.id = c.video_id
        WHERE c.embedding IS NULL
    """
    cur.execute(sql)
    rows = cur.fetchall()
    return len(rows), rows


def main():
    dry_run = "--dry-run" in sys.argv
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        print("DATABASE_URL env var not set", file=sys.stderr)
        sys.exit(1)

    vector_db = load_vector_db()

    with psycopg2.connect(db_url) as conn:
        conn.autocommit = False  # explicit tx
        with conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
            missing_count, rows = fetch_null_chunks(cur)
            print(f"Found {missing_count} chunk rows with NULL embedding")
            updated = 0
            batch = []
            for row in rows:
                chunk_id, youtube_id, chunk_index = row
                vec_key = f"{youtube_id}_{chunk_index}"
                vec = vector_db.vectors.get(vec_key)
                if vec is None:
                    # fallback: maybe int index without leading zeros? skip for now
                    continue
                batch.append((json.dumps(vec.tolist()), chunk_id))
                updated += 1
            if not batch:
                print("Nothing to update – matching vectors not found.")
                return

            print(f"Will update {updated} rows with embeddings")
            if dry_run:
                print("Dry run – exiting without commit.")
                conn.rollback()
                return

            psycopg2.extras.execute_batch(
                cur,
                "UPDATE chunks SET embedding = %s WHERE id = %s",
                batch,
                page_size=1000,
            )
            conn.commit()
            print(f"Committed {updated} updates to Postgres")


if __name__ == "__main__":
    main() 