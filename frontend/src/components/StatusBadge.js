import React from 'react';

const StatusBadge = ({ status }) => {
    const statusConfig = {
        pending: { color: 'bg-gray-100 text-gray-800', label: 'Pending' },
        in_progress: { color: 'bg-blue-100 text-blue-800', label: 'In Progress' },
        completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
        blocked: { color: 'bg-red-100 text-red-800', label: 'Blocked' },
    };

    const config = statusConfig[status] || statusConfig.pending;

    return (
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${config.color}`}>
            {config.label}
        </span>
    );
};

export default StatusBadge;