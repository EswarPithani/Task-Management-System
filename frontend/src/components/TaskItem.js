import React, { useState } from 'react';
import { FaTrash, FaLink, FaExclamationTriangle } from 'react-icons/fa';
import StatusBadge from './StatusBadge';

const TaskItem = ({
    task,
    onUpdate,
    onDelete,
    onAddDependency,
    allTasks
}) => {
    const [showDependencyForm, setShowDependencyForm] = useState(false);
    const [selectedDependency, setSelectedDependency] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null); // Changed to object to store error details

    const handleStatusChange = async (newStatus) => {
        try {
            await onUpdate(task.id, { status: newStatus });
        } catch (err) {
            console.error('Failed to update status:', err);
        }
    };

    const handleAddDependency = async () => {
        if (!selectedDependency) {
            setError({ error: 'Please select a task' });
            return;
        }

        if (selectedDependency === task.id.toString()) {
            setError({
                error: 'A task cannot depend on itself',
                path: [task.id, task.id]
            });
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await onAddDependency(task.id, parseInt(selectedDependency));
            setShowDependencyForm(false);
            setSelectedDependency('');
        } catch (err) {
            // err is now the error object from backend
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    // Filter out tasks that can't be dependencies (circular or self)
    const availableTasks = allTasks.filter(otherTask =>
        otherTask.id !== task.id
    );

    // Function to render error message properly
    const renderErrorMessage = () => {
        if (!error) return null;

        const isCircularError = error.error?.includes('Circular') || error.error?.includes('circular');
        const isSelfDependency = error.error?.includes('itself') || (error.path && error.path[0] === error.path[1]);

        return (
            <div className={`mb-2 p-3 rounded-md ${isCircularError ? 'bg-red-50 border border-red-200' :
                isSelfDependency ? 'bg-yellow-50 border border-yellow-200' :
                    'bg-red-50 border border-red-200'
                }`}>
                <div className="flex items-start space-x-2">
                    <FaExclamationTriangle className={`mt-0.5 ${isCircularError ? 'text-red-600' :
                        isSelfDependency ? 'text-yellow-600' :
                            'text-red-600'
                        }`} />
                    <div className="flex-1">
                        <p className={`font-medium ${isCircularError ? 'text-red-700' :
                            isSelfDependency ? 'text-yellow-700' :
                                'text-red-700'
                            }`}>
                            {error.error || 'Failed to add dependency'}
                        </p>

                        {/* Show circular dependency path if available */}
                        {error.path && error.path.length > 0 && (
                            <div className="mt-1">
                                <p className="text-sm text-gray-600 mb-1">Circular path detected:</p>
                                <div className="flex items-center space-x-2 text-sm">
                                    {error.path.map((taskId, index) => (
                                        <React.Fragment key={index}>
                                            <span className="px-2 py-1 bg-gray-100 rounded">
                                                Task {taskId}: {allTasks.find(t => t.id === taskId)?.title || `#${taskId}`}
                                            </span>
                                            {index < error.path.length - 1 && (
                                                <span className="text-gray-400">→</span>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <h3 className="font-semibold text-lg">{task.title}</h3>
                    <p className="text-gray-600 text-sm mt-1">{task.description}</p>
                </div>
                <StatusBadge status={task.status} />
            </div>

            <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                <span>ID: {task.id}</span>
                <span>Dependencies: {task.dependency_count || 0}</span>
                <span>Dependents: {task.dependent_count || 0}</span>
            </div>

            {/* Status Update Dropdown */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Update Status
                </label>
                <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                >
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="blocked">Blocked</option>
                </select>
            </div>

            {/* Add Dependency Section */}
            {!showDependencyForm ? (
                <button
                    onClick={() => {
                        setShowDependencyForm(true);
                        setError(null);
                    }}
                    className="w-full mb-3 flex items-center justify-center space-x-2 px-3 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
                >
                    <FaLink />
                    <span>Add Dependency</span>
                </button>
            ) : (
                <div className="mb-3 p-3 bg-blue-50 rounded-md">
                    <div className="flex items-center space-x-2 mb-2">
                        <FaLink className="text-blue-600" />
                        <span className="font-medium">Add Dependency</span>
                    </div>

                    {/* Render error message */}
                    {renderErrorMessage()}

                    <select
                        value={selectedDependency}
                        onChange={(e) => {
                            setSelectedDependency(e.target.value);
                            setError(null); // Clear error when selection changes
                        }}
                        className="w-full mb-2 px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                        <option value="">Select a task to depend on</option>
                        {availableTasks.map(t => (
                            <option key={t.id} value={t.id}>
                                {t.title} (ID: {t.id})
                            </option>
                        ))}
                    </select>

                    <div className="flex space-x-2">
                        <button
                            onClick={handleAddDependency}
                            disabled={loading || !selectedDependency}
                            className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Checking...' : 'Add Dependency'}
                        </button>
                        <button
                            onClick={() => {
                                setShowDependencyForm(false);
                                setError(null);
                                setSelectedDependency('');
                            }}
                            className="px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                    onClick={() => {
                        if (window.confirm(`Delete task "${task.title}"?\n\nNote: This will fail if other tasks depend on this task.`)) {
                            onDelete(task.id);
                        }
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                    title="Delete task"
                >
                    <FaTrash />
                </button>
            </div>
        </div>
    );
};

export default TaskItem;