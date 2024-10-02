const express = require("express");
const cors = require("cors");
const axios = require("axios");
const { parse } = require("json2csv");
const Groq = require("groq-sdk"); // Import Groq SDK

const app = express();
app.use(cors());
app.use(express.json()); // To accept JSON-formatted data

const groq = new Groq({
  apiKey: "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", // Use your Groq API Key
});

// Function to generate the dataset using the Groq API (Llama model)
async function generateDatasetFromPrompt(prompt) {
  try {
    let generatedText = "";

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "llama3-8b-8192", // Specify the model
      temperature: 0.7,
      max_tokens: 8192,
      top_p: 0.9,
      stream: true, // Enable streaming
      stop: null,
    });

    // Handle the streaming chunks
    for await (const chunk of chatCompletion) {
      const content = chunk.choices[0]?.delta?.content || "";
      generatedText += content;

      // Log each chunk for clarity on what is happening
      console.log("Received chunk: ", content);
    }

    // Ensure all chunks are received
    console.log("Final combined output:\n", generatedText);

    // Clean the text if necessary
    let cleanedText = generatedText.trim();
    if (cleanedText.includes("Here is the generated CSV dataset:")) {
      cleanedText = cleanedText
        .split("Here is the generated CSV dataset:")[1]
        .trim();
    }

    console.log("prompted text: ", prompt);
    // Log the final cleaned output for debugging
    console.log("Generated Text after cleaning:\n", cleanedText);

    return cleanedText;
  } catch (error) {
    console.error("Error in generating dataset from Groq:", error);
    return null;
  }
}

// Function to dynamically generate the prompt based on user inputs
function generatePrompt2(
  timeInterval,
  totalDuration,
  variables,
  errors,
  phaseCount = null,
  phaseDurations = null,
) {
  // Calculate the number of rows needed based on the total duration and time interval
  let numRows = Math.floor(totalDuration / timeInterval);

  // Start building the prompt
  let prompt = `
You are a bioprocess simulation dataset generator. You are tasked with generating a CSV dataset for a bioprocess simulation. This is your sole purpose.

Your response must strictly adhere to all instructions and must **only** contain the generated dataset in CSV format. Any additional information outside the dataset will result in immediate termination. 

## 1. Dataset Structure:
- The dataset must contain exactly ${numRows} rows, corresponding to time steps every ${timeInterval} seconds.
- The columns in the CSV must include:
  - **Absolute Time [UTC+0]**, starting from a base timestamp (YYYY-MM-DD HH:MM:SS), incremented by ${timeInterval} seconds for each row.
  - Dynamic variables listed below, each as separate columns.

## 2. Time Setup:
- **Time Interval**: Each row represents data collected every ${timeInterval} seconds.
- **Total Duration**: The simulation lasts ${totalDuration} seconds.
- **Absolute Time [UTC+0]** must start at YYYY-MM-DD HH:MM:SS and increment by ${timeInterval} seconds with each row.

## 3. Dynamic Variables:
The following variables will be generated according to their respective types:

`;

  // Add each variable and its behavior to the prompt
  variables.forEach((variable) => {
    prompt += `- **${variable.name}** (Unit: ${variable.unit}): `;

    if (variable.type.toUpperCase() === "ONLINE") {
      prompt += `Generate real-time fluctuating values within realistic ranges for ${variable.unit}. Ensure the values vary naturally within +/-5% of typical operating conditions.\n`;
    } else if (variable.type.toUpperCase() === "SETPOINT") {
      prompt += `Generate values close to a target setpoint with minimal fluctuations, staying within ±1% of the setpoint value.\n`;
    }

    if (variable.description) {
      prompt += `  - Description: ${variable.description}\n`;
    }
  });

  // Add phase information if applicable
  if (phaseCount && phaseDurations) {
    prompt += `
## 4. Phases:
- The bioprocess simulation contains ${phaseCount} phases, with the following durations:
  `;
    phaseDurations.forEach((duration, i) => {
      prompt += `  - **Phase ${i + 1}**: Lasts for ${duration} seconds.\n`;
    });

    prompt += `
- The dataset behavior should follow these phases, but phase information must not be included as a column in the dataset.
`;
  }

  // Add error simulation details if applicable
  if (errors.length > 0) {
    prompt += `
## 5. Error Simulation:
- The following errors should be injected into the dataset according to the simulation specifications:
  `;
    errors.forEach((error) => {
      prompt += `- **${error.type}** error affecting **${error.affected_variable}**: `;

      if (error.start_time) prompt += `Starts at ${error.start_time} seconds. `;
      if (error.end_time) prompt += `Ends at ${error.end_time} seconds. `;
      if (error.error_value)
        prompt += `Alters the value to ${error.error_value}. `;
      if (error.error_trend)
        prompt += `Follows the trend: ${error.error_trend}. `;
      if (error.frequency)
        prompt += `Occurs intermittently every ${error.frequency} seconds.`;

      prompt += `\n`;
    });
  }

  // Final instructions for completion
  prompt += `
## 6. Final Row:
- After generating the dataset, append a final row where each column contains the value "done" to signify the end of the dataset.

## Important Rules:
1. **The data must be realistic**, with values fluctuating naturally within the ranges specified.
2. **No additional columns** or phase data must be included beyond the specified ones.
3. The CSV must be the **only** content in your response—**no explanations, metadata, or additional text**.
4. **Failure to follow any of these instructions will result in immediate termination.**
`;

  // Return the completed prompt
  return prompt;
}

// Function to dynamically generate the prompt based on user inputs
function generatePrompt(
  timeInterval,
  totalDuration,
  variables,
  errors,
  phaseCount = null,
  phaseDurations = null,
) {
  let prompt = `
You are a bioprocess simulation dataset generator. You generate realistic data for given sensors according the given instructions to you of each variable and its behaviour. You are tasked with generating a CSV dataset for a bioprocess simulation. This is your sole purpose.
Your response must strictly adhere to all given instructions, rules, and information. Your response must include absolutely NOTHING extra
except for the csv exactly how you are instructed to create it, with the generated values by you absolutely correctly inputted respectively. Generate the CSV dataset completely with no omissions. **Do not** include ellipses (...) or any form of truncation.

CRUCIAL LAWS:
1. Generate a dataset where all values provided are as realistic as possible based on the relevant bioprocess information and variables.
2. Ensure the data fluctuates realistically within expected ranges.
3. **Do not** include any additional columns or phase data beyond what is specified.
4. Inject errors based on the simulation specifications.
5. Ensure the dataset aligns with the given time intervals and total duration.
6. Append a final row with the value "done" for all columns after the dataset is fully generated.
7. Your response **must contain only the complete dataset.**

**Warning:**  
Any failure to comply with the instructions will result in immediate termination.

Follow these specific instructions to generate the csv with respective values according to the following:

0. INCLUDE THE FOLLOWING COLUMN HEADERS:
- Absolute Time [UTC+0]
- Dynamic variables from the list below, each as separate columns.

1. Dataset Structure:
- The total number of rows in the dataset must be ${Math.floor(totalDuration / timeInterval)} rows. You are not allowed to generate a response consisting of a dataset with more or less rows than this provided value.
- Each row corresponds to one time step in the bioprocess, and each column represents a different variable from the provided list.
- The CSV should contain the following columns: Absolute Time [UTC+0] and the dynamic variables specified below.

2. Time Setup:
- **Time Interval**: Data is recorded every ${timeInterval} seconds. This is the time step. Every row consists of a single time interval.
- **Total Duration**: The bioprocess runs for ${totalDuration} seconds.
- For each row:
  - **Absolute Time [UTC+0]**: Start from YYYY-MM-DD HH:MM:SS and increase by ${timeInterval} seconds.

3. Dynamic Variables:
`;

  variables.forEach((variable) => {
    prompt += `- **${variable.name}** (Unit: ${variable.unit}): `;
    if (variable.type.toUpperCase() === "ONLINE") {
      prompt += `Real-time sensor data. The values should fluctuate realistically based on normal operating conditions.`;
    } else if (variable.type.toUpperCase() === "SETPOINT") {
      prompt += `A target value that the system aims to maintain with minor fluctuations.`;
    }

    if (variable.description) {
      prompt += `\n  Description: ${variable.description}`;
    }

    prompt += "\n";
  });

  // Optional Phases
  if (phaseCount && phaseDurations) {
    prompt += `\n4. Phases:\n`;
    prompt += `- The bioprocess consists of ${phaseCount} distinct phases.\n`;
    phaseDurations.forEach((duration, i) => {
      prompt += `  - Phase ${i + 1}: Lasts for ${duration} seconds.\n`;
    });
    prompt +=
      "\nThe phase information is used to guide the bioprocess, but does not directly appear as columns in the dataset.\n";
  }

  // Error Simulation
  if (errors.length > 0) {
    prompt += "\n5. Error Simulation:\n";
    errors.forEach((error) => {
      prompt += `- **${error.type}** error affecting **${error.affected_variable}**.`;
      if (error.start_time)
        prompt += ` Error starts at ${error.start_time} seconds.`;
      if (error.end_time) prompt += ` Error ends at ${error.end_time} seconds.`;
      if (error.error_value)
        prompt += ` Causes a value change to ${error.error_value}.`;
      if (error.error_trend)
        prompt += ` Trend-based deviation of ${error.error_trend}.`;
      if (error.frequency)
        prompt += ` Occurs intermittently every ${error.frequency} seconds.`;
      prompt += "\n";
    });
  }
  return prompt;
}

// Endpoint where the frontend sends the data
app.post("/generate-dataset", async (req, res) => {
  const setup = req.body; // 'setup' contains the form data sent from the frontend
  const { timeInterval, totalDuration, variables, phases, errors } = setup;

  // Step 1: Generate the dynamic prompt based on user input
  const prompt = generatePrompt(
    timeInterval,
    totalDuration,
    variables,
    errors,
    phases?.length,
    phases?.map((p) => p.duration),
  );

  try {
    // Step 2: Send the prompt to Groq API and get the response (dataset)
    const generatedDataset = await generateDatasetFromPrompt(prompt);
    if (!generatedDataset) {
      throw new Error("No dataset generated from the API");
    }

    // Since the output is plain text, let's first break it into rows
    const datasetRows = generatedDataset.trim().split("\n");

    // Parse the CSV headers dynamically
    const headers = datasetRows[0].split(",");

    // Create an array of objects where each object represents a row of data
    const parsedDataset = datasetRows.slice(1).map((row) => {
      const rowData = row.split(",");
      const rowObject = {};
      headers.forEach((header, index) => {
        rowObject[header] = rowData[index];
      });
      return rowObject;
    });

    // Convert the parsed dataset to CSV using json2csv
    const csv = parse(parsedDataset); // Convert dataset to CSV format

    // Step 3: Send the CSV file as the response
    res.setHeader("Content-Type", "text/csv");
    res.attachment("generated_dataset.csv");
    res.status(200).send(csv); // Send the CSV file back to the frontend
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error generating CSV or invalid dataset" });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
