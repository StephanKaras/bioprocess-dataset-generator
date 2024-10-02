# Qubicon Simulation Dataset Generator - Full Documentation

## Project Overview

The **Qubicon Simulation Dataset Generator** is a tool for generating realistic bioprocess simulation datasets based on user-defined variables, phases, and error conditions. It allows users to configure various parameters, such as time intervals, dynamic variables, and error types, and outputs a CSV file containing the simulation data.

The project is split into two main components:

1. **Frontend**: A React-based user interface where users define the simulation setup, including variables, phases, and error configurations. It sends this configuration to the backend to generate a dataset.
2. **Backend**: A Node.js Express server that processes the user's simulation setup, dynamically generates a prompt for an AI model (Groq Llama3), and returns the generated CSV dataset.

This documentation explains the structure, purpose, and functionality of each component in detail.

---

## Table of Contents

1. [Project Setup](#project-setup)
2. [Frontend Overview](#frontend-overview)
    - [React Component: `BioprocessSimulatorComponent`](#react-component-bioprocesssimulatorcomponent)
    - [State Management](#state-management)
    - [Functions](#functions)
    - [User Interface](#user-interface)
3. [Backend Overview](#backend-overview)
    - [Express Server](#express-server)
    - [AI Integration (Groq API)](#ai-integration-groq-api)
4. [API Routes](#api-routes)
5. [Conclusion](#conclusion)

---

## Project Setup

### Prerequisites

- **Frontend**:
    - React (Next.js framework)
    - Axios (for making HTTP requests)
    - UI components from Shadcn/UI
    - Node.js

- **Backend**:
    - Node.js (Express)
    - Groq SDK (AI model for dataset generation)
    - json2csv (for generating CSV output)
    - CORS (to handle cross-origin requests)

### Installation

1. Clone the repository.
2. Install dependencies:
    ```bash
    npm install
    ```
3. Start the frontend:
    ```bash
    npm run dev
    ```
4. Start the backend:
    ```bash
    node server.js
    ```

---

## Frontend Overview

The frontend is a React component that handles user inputs, allows for customization of the simulation parameters, and communicates with the backend API to generate and download a dataset.

### React Component: `BioprocessSimulatorComponent`

This is the main functional component responsible for rendering the user interface and managing user inputs for simulation setup.

#### Types

- **Variable**: Represents dynamic variables in the bioprocess simulation (e.g., temperature, pressure).
    ```ts
    type Variable = {
      id: string;
      name: string;
      physicalQuantity: string;
      unit: string;
      type: "ONLINE" | "SETPOINT";
      equipment: string;
      description?: string;
    };
    ```

- **Phase**: Represents a phase in the simulation, where certain variables are active for a defined duration.
    ```ts
    type Phase = {
      id: string;
      name: string;
      duration: number;
      variableIds: string[];
    };
    ```

- **Error**: Represents simulated errors that affect phases and variables during the simulation.
    ```ts
    type Error = {
      id: string;
      type: "sudden" | "gradual" | "intermittent" | "system failure";
      startTime?: number;
      endTime?: number;
      affectedPhases: string[];
      frequency?: number;
      affectedVariables: string[];
      errorValue: number;
      severity: "low" | "medium" | "high";
      description?: string;
    };
    ```

- **SimulationSetup**: The full configuration that includes the time interval, total duration, and arrays of variables, phases, and errors.
    ```ts
    type SimulationSetup = {
      timeInterval: number;
      totalDuration: number;
      variables: Variable[];
      phases: Phase[];
      errors: Error[];
    };
    ```

### State Management

- **setup**: This state stores the entire configuration of the simulation. It includes:
    - `timeInterval`: Time between each data recording (in seconds).
    - `totalDuration`: Total time span for the simulation (in seconds).
    - Arrays for `variables`, `phases`, and `errors`.

### Functions

1. **addVariable**: Adds a new variable to the simulation.
    ```ts
    const addVariable = () => { /* logic for adding variable */ }
    ```

2. **updateVariable**: Updates an existing variable.
    ```ts
    const updateVariable = (id: string, updatedVariable: Partial<Variable>) => { /* logic for updating variable */ }
    ```

3. **deleteVariable**: Removes a variable from the simulation.
    ```ts
    const deleteVariable = (id: string) => { /* logic for deleting variable */ }
    ```

4. **addPhase**, **updatePhase**, **deletePhase**: Manage the phases of the simulation.

5. **addError**, **updateError**, **deleteError**: Manage the errors that occur during the simulation.

6. **generateDataset**: Sends the entire simulation setup to the backend API and triggers the generation and download of a CSV file.
    ```ts
    const generateDataset = async () => { /* logic for dataset generation */ }
    ```

### User Interface

The interface consists of various form elements (inputs, selects, buttons) to allow users to define the simulation parameters. These include:

- **Time Interval**: Defines how often data is recorded.
- **Total Duration**: Sets the total simulation duration.
- **Variables Section**: Allows the user to add, edit, or delete dynamic variables for the simulation.
- **Phases Section**: Configures different phases of the bioprocess.
- **Errors Section**: Allows the user to inject different types of errors during the simulation.
- **Generate Dataset Button**: Triggers the dataset generation.

---

## Backend Overview

The backend uses Express to expose an API that the frontend interacts with. It integrates with the **Groq API** to generate datasets based on user-provided configurations.

### Express Server

The server has a single POST route that handles incoming simulation setups and interacts with the **Groq AI model** to generate realistic datasets.

```js
app.post("/generate-dataset", async (req, res) => { /* logic for handling the request */ });
```

### AI Integration (Groq API)

The project uses the **Groq Llama3** model to generate data based on user inputs. The key steps involve:

1. **Generating a prompt**: The user's inputs are converted into a structured prompt for the AI model.
    ```js
    const prompt = generatePrompt(timeInterval, totalDuration, variables, errors, phaseCount, phaseDurations);
    ```

2. **Calling the Groq API**: The prompt is sent to the Groq model, and the AI returns the generated dataset as a plain-text CSV.

3. **CSV Generation**: The backend converts the generated dataset into a CSV format using `json2csv` and sends it back to the frontend.

---

## API Routes

### `POST /generate-dataset`

#### Request Body
- **timeInterval**: Number (e.g., 5 seconds)
- **totalDuration**: Number (e.g., 3600 seconds)
- **variables**: Array of variables (type, unit, description, etc.)
- **phases**: Array of phases (duration, associated variables)
- **errors**: Array of errors (type, severity, affected variables, phases)

#### Response
- A **CSV file** containing the generated dataset.

---

## Conclusion

This project allows users to define bioprocess simulations in a flexible and intuitive manner. It uses AI (Groq API) to generate realistic datasets that reflect real-time sensor behavior, setpoints, and various error conditions. The resulting datasets can be used for analysis, training models, or conducting research in bioprocess simulations.

---