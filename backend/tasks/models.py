# backend/tasks/models.py
from django.db import models

class Task(models.Model):
    # Status choices
    PENDING = 'pending'
    IN_PROGRESS = 'in_progress'
    COMPLETED = 'completed'
    BLOCKED = 'blocked'
    
    STATUS_CHOICES = [
        (PENDING, 'Pending'),
        (IN_PROGRESS, 'In Progress'),
        (COMPLETED, 'Completed'),
        (BLOCKED, 'Blocked'),
    ]
    
    # Fields
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=PENDING
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.id}: {self.title} ({self.status})"
    
    class Meta:
        ordering = ['-created_at']


class TaskDependency(models.Model):
    # A dependency means: task "depends_on" another task
    # Example: If Task A depends on Task B, then:
    # task = Task A, depends_on = Task B
    task = models.ForeignKey(
        Task, 
        on_delete=models.CASCADE,
        related_name='dependencies'
    )
    depends_on = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='dependents'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        # A task can't have the same dependency twice
        unique_together = ['task', 'depends_on']
        verbose_name_plural = 'Task dependencies'
    
    def __str__(self):
        return f"{self.task.title} depends on {self.depends_on.title}"