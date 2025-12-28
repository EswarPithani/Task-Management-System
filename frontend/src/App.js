// frontend/src/App.js - UPDATED VERSION
import React from 'react';
import TaskList from './components/TaskList';
import GraphVisualization from './components/GraphVisualization';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Task Dependency Management System
          </h1>
          <p className="text-gray-600 mt-2">
            Manage tasks, dependencies, and visualize relationships
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Task Management Section */}
        <div className="mb-8">
          <TaskList />
        </div>

        {/* Graph Visualization Section - Now below tasks */}
        <div className="mt-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <GraphVisualization />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;