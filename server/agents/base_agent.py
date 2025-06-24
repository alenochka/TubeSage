from abc import ABC, abstractmethod
from typing import Any, Dict, List
import logging
import time
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class BaseAgent(ABC):
    """Base class for all agents in the multi-agent system"""
    
    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
        self.status = "inactive"
        self.queue = []
        self.total_tasks = 0
        self.successful_tasks = 0
        self.start_time = time.time()
        self.last_action = None
        
    @abstractmethod
    async def process_task(self, task: Dict[str, Any]) -> Dict[str, Any]:
        """Process a single task"""
        pass
    
    async def add_task(self, task: Dict[str, Any]):
        """Add a task to the agent's queue"""
        self.queue.append(task)
        logger.info(f"[{self.name}] Task added to queue. Queue size: {len(self.queue)}")
    
    async def execute_next_task(self) -> Dict[str, Any]:
        """Execute the next task in the queue"""
        if not self.queue:
            return {"status": "no_tasks", "message": "No tasks in queue"}
        
        self.status = "busy"
        task = self.queue.pop(0)
        self.total_tasks += 1
        
        try:
            logger.info(f"[{self.name}] Processing task: {task.get('type', 'unknown')}")
            result = await self.process_task(task)
            self.successful_tasks += 1
            self.last_action = f"Completed {task.get('type', 'task')}"
            self.status = "active"
            
            logger.info(f"[{self.name}] Task completed successfully")
            return {"status": "success", "result": result}
            
        except Exception as e:
            logger.error(f"[{self.name}] Task failed: {str(e)}")
            self.status = "active"
            return {"status": "error", "error": str(e)}
    
    def get_status(self) -> Dict[str, Any]:
        """Get current agent status"""
        uptime_minutes = int((time.time() - self.start_time) / 60)
        
        return {
            "name": self.name,
            "description": self.description,
            "status": self.status,
            "queue_count": len(self.queue),
            "uptime": uptime_minutes,
            "total_tasks": self.total_tasks,
            "successful_tasks": self.successful_tasks,
            "last_action": self.last_action,
            "success_rate": (self.successful_tasks / max(1, self.total_tasks)) * 100
        }
    
    def log_action(self, message: str, level: str = "info"):
        """Log an action with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        formatted_message = f"[{timestamp}] [{self.name.upper()}] {message}"
        
        if level == "error":
            logger.error(formatted_message)
        elif level == "warning":
            logger.warning(formatted_message)
        else:
            logger.info(formatted_message)
