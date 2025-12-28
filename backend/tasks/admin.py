# backend/tasks/admin.py - CORRECTED VERSION
from django.contrib import admin
from .models import Task, TaskDependency

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'status', 'created_at']
    list_filter = ['status']
    search_fields = ['title', 'description']
    readonly_fields = ['created_at', 'updated_at']

# FIXED LINE: Changed TDependency to TaskDependency
@admin.register(TaskDependency)
class TaskDependencyAdmin(admin.ModelAdmin):
    list_display = ['id', 'task', 'depends_on', 'created_at']
    list_filter = ['created_at']
    search_fields = ['task__title', 'depends_on__title']