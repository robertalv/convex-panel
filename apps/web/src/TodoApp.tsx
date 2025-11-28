import { useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from "@repo/backend/convex/_generated/api"

export default function TodoApp() {
  const [newTodoTitle, setNewTodoTitle] = useState('');

  // Queries and Mutations
  const todos = useQuery(api.todo.list);
  const createTodo = useMutation(api.todo.create);
  const toggleTodo = useMutation(api.todo.toggle);
  const removeTodo = useMutation(api.todo.remove);

  const handleSubmit = async () => {
    if (!newTodoTitle.trim()) return;

    await createTodo({ title: newTodoTitle });
    setNewTodoTitle('');
  };

  const handleKeyPress = (e:React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  const handleToggle = async (id:string) => {
    await toggleTodo({ id });
  };

  const handleDelete = async (id:string) => {
    await removeTodo({ id });
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>My Todo List</h1>

      <div style={styles.form}>
        <input
          type="text"
          value={newTodoTitle}
          onChange={(e) => setNewTodoTitle(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Add a new todo..."
          style={styles.input}
        />
        <button onClick={handleSubmit} style={styles.addButton}>
          Add Todo
        </button>
      </div>

      <div style={styles.todoList}>
        {!todos ? (
          <p style={styles.loading}>Loading todos...</p>
        ) : todos.length === 0 ? (
          <p style={styles.empty}>No todos yet. Add one above!</p>
        ) : (
          todos.map((todo) => (
            <div key={todo._id} style={styles.todoItem}>
              <div style={styles.todoContent}>
                <input
                  type="checkbox"
                  checked={todo.done}
                  onChange={() => handleToggle(todo._id)}
                  style={styles.checkbox}
                />
                <span
                  style={{
                    ...styles.todoText,
                    textDecoration: todo.done ? 'line-through' : 'none',
                    opacity: todo.done ? 0.6 : 1,
                  }}
                >
                  {todo.title}
                </span>
              </div>
              <button
                onClick={() => handleDelete(todo._id)}
                style={styles.deleteButton}
              >
                Delete
              </button>
            </div>
          ))
        )}
      </div>

      {todos && todos.length > 0 && (
        <div style={styles.stats}>
          <p style={{ margin: 0 }}>
            Total: {todos.length} | Completed: {todos.filter((t) => t.done).length} |
            Active: {todos.filter((t) => !t.done).length}
          </p>
        </div>
      )}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  container: {
    maxWidth: '600px',
    margin: '50px auto',
    padding: '20px',
    fontFamily: 'Arial, sans-serif',
    backgroundColor: '#f9f9f9',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
  },
  title: {
    textAlign: 'center',
    color: '#333',
    marginBottom: '30px',
  },
  form: {
    display: 'flex',
    gap: '10px',
    marginBottom: '30px',
  },
  input: {
    flex: 1,
    padding: '12px',
    fontSize: '16px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    outline: 'none',
  },
  addButton: {
    padding: '12px 24px',
    fontSize: '16px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  todoList: {
    marginBottom: '20px',
  },
  todoItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '15px',
    backgroundColor: 'white',
    marginBottom: '10px',
    borderRadius: '4px',
    border: '1px solid #eee',
  },
  todoContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flex: 1,
  },
  checkbox: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
  },
  todoText: {
    fontSize: '16px',
    color: '#333',
  },
  deleteButton: {
    padding: '8px 16px',
    fontSize: '14px',
    backgroundColor: '#f44336',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  loading: {
    textAlign: 'center',
    color: '#666',
    fontSize: '16px',
  },
  empty: {
    textAlign: 'center',
    color: '#999',
    fontSize: '16px',
    padding: '20px',
  },
  stats: {
    textAlign: 'center',
    padding: '15px',
    backgroundColor: '#e8f5e9',
    borderRadius: '4px',
    color: '#2e7d32',
    fontSize: '14px',
  },
};