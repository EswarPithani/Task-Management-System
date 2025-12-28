import React, { useState, useEffect } from 'react';
import TaskItem from './TaskItem';
import TaskForm from './TaskForm';
import { taskAPI } from '../services/api';

const TaskList = () => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const response = await taskAPI.getAll();
            setTasks(response.data);
            setError('');
        } catch (err) {
            setError('Failed to fetch tasks');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTasks();
    }, []);

    const handleTaskCreated = (newTask) => {
        setTasks([newTask, ...tasks]);
        setShowCreateForm(false);
    };

    const handleTaskUpdate = async (taskId, updateData) => {
        try {
            const response = await taskAPI.update(taskId, updateData);
            setTasks(tasks.map(task =>
                task.id === taskId ? response.data : task
            ));
        } catch (err) {
            console.error('Failed to update task:', err);
            throw err;
        }
    };

    const handleTaskDelete = async (taskId) => {
        try {
            await taskAPI.delete(taskId);
            setTasks(tasks.filter(task => task.id !== taskId));
        } catch (err) {
            console.error('Failed to delete task:', err);
            alert('Failed to delete task. Make sure no tasks depend on it.');
        }
    };

    // In TaskList.jsx, update the handleAddDependency function:
    const handleAddDependency = async (taskId, dependsOnId) => {
        try {
            await taskAPI.addDependency(taskId, dependsOnId);
            // Refresh tasks to get updated statuses
            fetchTasks();
            return Promise.resolve(); // Success
        } catch (err) {
            // Pass the error object to TaskItem
            throw err;
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-gray-500">Loading tasks...</div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Task Management</h1>
                <button
                    onClick={() => setShowCreateForm(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                    + New Task
                </button>
            </div>

            {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg">
                    {error}
                </div>
            )}

            {showCreateForm && (
                <div className="mb-6">
                    <TaskForm
                        onTaskCreated={handleTaskCreated}
                        onClose={() => setShowCreateForm(false)}
                    />
                </div>
            )}

            {tasks.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">No tasks yet. Create your first task!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tasks.map(task => (
                        <TaskItem
                            key={task.id}
                            task={task}
                            onUpdate={handleTaskUpdate}
                            onDelete={handleTaskDelete}
                            onAddDependency={handleAddDependency}
                            allTasks={tasks}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default TaskList;