# GraphQL Query Visualizer

An interactive tool to visualize and edit GraphQL query structures. This application helps developers understand and debug their GraphQL queries by representing them as a graph. Users can input a GraphQL query or a JSON object containing a query, and the visualizer will generate an interactive diagram.

## Key Features

- **Interactive Visualization:** View GraphQL queries as a tree structure.
- **Query Editing:** Modify the query by interacting with the graph.
- **JSON Support:** Parses GraphQL queries from JSON objects.
- **Syntax Highlighting:** The query input editor supports GraphQL syntax highlighting.
- **Resizable Layout:** Adjust the view between the query editor and the graph visualization.

## How to Use

1.  **Enter Your Query:** Paste your GraphQL query into the editor on the left.
2.  **Visualize:** The graph will automatically update to reflect the query's structure.
3.  **Interact with the Graph:** Click on nodes to expand or collapse them.
4.  **Edit the Query:** As you interact with the graph, the query in the editor will update in real-time.

## Directory Structure

```
.
├── src/
│   ├── react-app/
│   │   ├── components/
│   │   │   ├── GraphVisualization.tsx
│   │   │   ├── QueryInput.tsx
│   │   │   └── ResizableLayout.tsx
│   │   ├── pages/
│   │   │   └── Home.tsx
│   │   ├── utils/
│   │   │   ├── graphql-parser.ts
│   │   │   └── json-parser.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   └── shared/
│       └── types.ts
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── index.html
├── package.json
└── vite.config.ts
```

## Running the Project Locally

To run the project locally, follow these steps:

1.  **Clone the repository:**
    ```sh
    git clone <repository-url>
    ```
2.  **Navigate to the project directory:**
    ```sh
    cd mocha-app
    ```
3.  **Install dependencies:**
    ```sh
    npm install
    ```
4.  **Start the development server:**
    ```sh
    npm run dev
    ```
5.  **Open your browser** and navigate to `http://localhost:5173` (or the address shown in your terminal).

## Technologies Used

-   **React:** A JavaScript library for building user interfaces.
-   **Vite:** A fast build tool and development server for modern web projects.
-   **D3.js:** A JavaScript library for manipulating documents based on data.
-   **Hono:** A small, simple, and ultrafast web framework for the Edge.
-   **TypeScript:** A typed superset of JavaScript that compiles to plain JavaScript.
-   **Tailwind CSS:** A utility-first CSS framework for rapid UI development.
