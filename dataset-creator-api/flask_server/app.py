from flask import Flask, request, jsonify
from groq import Groq

app = Flask(__name__)

# Initialize the Groq client with your API key
client = Groq(api_key="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")


def generate_dataset_from_prompt(prompt):
    messages = [{"role": "user", "content": prompt}]

    completion = client.chat.completions.create(
        model="llama3-70b-8192",
        messages=messages,
        temperature=1,
        max_tokens=8192,
        top_p=1,
        stream=False
    )

    # Extracting the generated text
    generated_text = completion['choices'][0]['message']['content']
    return generated_text


@app.route('/generate-dataset', methods=['POST'])
def generate_dataset():
    data = request.json
    time_interval = data['timeInterval']
    total_duration = data['totalDuration']
    variables = data['variables']
    errors = data.get('errors', [])
    phases = data.get('phases', None)

    # Here you can construct the prompt dynamically
    prompt = generate_prompt(time_interval, total_duration, variables, errors, phases)

    # Send the prompt to the model and get the response
    generated_dataset = generate_dataset_from_prompt(prompt)

    # Return the generated dataset as a response
    return jsonify({"generated_dataset": generated_dataset})


def generate_prompt(time_interval,
                    total_duration,
                    variables,
                    errors,
                    phase_count=None,
                    phase_durations=None):
    prompt = f"""
You are a bioprocess simulation dataset generator. You are tasked with generating a CSV dataset for a bioprocess simulation. This is your sole purpose.
Your response must strictly adhere to all given instructions, rules, and information. Your response must include absolutely NOTHING extra
except for the csv exactly how you are instructed to create it, with the generated values by you absolutely correctly inputted respectively.
Follow these specific instructions:

1. Dataset Structure:
- The total number of rows in the dataset must be {int(total_duration / time_interval)} rows. You are not allowed to generate a response consisting of a dataset with more or less rows than this provided value.
- Each row corresponds to one time step in the bioprocess, and each column represents a different variable from the provided list.
- The CSV should contain the following columns: Absolute Time [UTC+0] and the dynamic variables specified below.

2. Time Setup:
- **Time Interval**: Data is recorded every {time_interval} seconds. This is the time step. every row consists of a single time interval.
- **Total Duration**: The bioprocess runs for {total_duration} seconds.
- For each row:
  - **Absolute Time [UTC+0]**: Start from YYYY-MM-DD HH:MM:SS and increase by {time_interval} seconds.

3. Dynamic Variables:
"""
    for variable in variables:
        prompt += f"- **{variable['name']}** (Type: {variable['type']}, Unit: {variable['unit']}): "
        if variable['type'].upper() == "ONLINE":
            prompt += f"Real-time sensor data. The values should fluctuate realistically based on normal operating conditions."
        elif variable['type'].upper() == "SETPOINT":
            prompt += f"A target value that the system aims to maintain with minor fluctuations."

        if variable.get('description'):
            prompt += f"\n  Description: {variable['description']}"

        prompt += "\n"

    # Optional Phases
    if phase_count and phase_durations:
        prompt += f"\n4. Phases:\n"
        prompt += f"- The bioprocess consists of {phase_count} distinct phases.\n"
        for i, duration in enumerate(phase_durations, 1):
            prompt += f"  - Phase {i}: Lasts for {duration} seconds.\n"
        prompt += "\nThe phase information is used to guide the bioprocess, but does not directly appear as columns in the dataset. It is strictly provided to you for better context hence better results.\n"

    # Error Simulation block
    if errors:
        prompt += "\n5. Error Simulation:\n"
        for error in errors:
            prompt += f"- **{error['type']}** error affecting **{error['affected_variable']}**."
            if error.get('start_time'):
                prompt += f" Error starts at {error['start_time']} seconds."
            if error.get('end_time'):
                prompt += f" Error ends at {error['end_time']} seconds."
            if error.get('error_value'):
                prompt += f" Causes a value change to {error['error_value']}."
            if error.get('error_trend'):
                prompt += f" Trend-based deviation of {error['error_trend']}."
            if error.get('frequency'):
                prompt += f" Occurs intermittently every {error['frequency']} seconds."

            prompt += "\n"

    # Final instructions for generating CSV
    prompt += """
Generate the CSV with the following columns:
- Absolute Time [UTC+0]
- Dynamic variables from the list above

Additional instructions:
1. Generate a dataset where all values provided are as realistic as possible based on the relevant bioprocess information and variables.
2. Ensure the data fluctuates realistically within expected ranges.
3. **Do not** include any additional columns or phase data beyond what is specified.
4. Inject errors based on the simulation specifications.
5. Ensure the dataset aligns with the given time intervals and total duration.
6. Append a final row with the value "done" for all columns after the dataset is fully generated.
7. Your response **must contain only the complete dataset.**  
   - **No introductory text, explanations, empty lines, or additional content** should appear in the response.

**Warning:**  
Any failure to comply with the instructions will result in immediate termination.
"""

    return prompt


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
