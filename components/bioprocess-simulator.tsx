"use client"

import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"

type Variable = {
  id: string
  name: string
  physicalQuantity: string
  unit: string
  type: "ONLINE" | "SETPOINT"
  equipment: string
  description?: string
}

type Phase = {
  id: string
  name: string
  duration: number
  variableIds: string[]
}

type ErrorType = "sudden" | "gradual" | "intermittent" | "system failure"

type Error = {
  id: string
  type: ErrorType
  startTime?: number
  endTime?: number
  affectedPhases: string[]
  frequency?: number
  affectedVariables: string[]
  errorValue: number
  severity: "low" | "medium" | "high"
  description?: string
}

type SimulationSetup = {
  timeInterval: number
  totalDuration: number
  variables: Variable[]
  phases: Phase[]
  errors: Error[]
}

import axios from 'axios';  // Import Axios for making HTTP requests


const errorTypes: { type: ErrorType; description: string }[] = [
  { type: "sudden", description: "Abrupt change in value" },
  { type: "gradual", description: "Slow drift over time" },
  { type: "intermittent", description: "Periodic fluctuations" },
  { type: "system failure", description: "Complete breakdown" },
]

export function BioprocessSimulatorComponent() {

  const [setup, setSetup] = useState<SimulationSetup>({
    timeInterval: 1,
    totalDuration: 3600,
    variables: [],
    phases: [],
    errors: []
  })

  const generateDataset = async () => {
    try {
      // Send a POST request to the Replit API
      const response = await axios.post(
        'https://e7d87eb8-f7c1-4ca9-b061-7b5956360304-00-10cup2tklyljv.spock.replit.dev/generate-dataset',  // Replace with your Replit API URL
        setup,  // Send the 'setup' state containing the form data as the payload
        {
          headers: {
            'Content-Type': 'application/json',
          },
          responseType: 'blob'  // To handle the CSV file response
        }
      );
  
      // Handle the response if it's a CSV file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'generated_dataset.csv');  // Set the file name for download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (error) {
      console.error("Error generating dataset:", error);
      alert('Failed to generate dataset. Please try again.');
    }
  };


  const addVariable = () => {
    const newVariable: Variable = {
      id: `var-${Date.now()}`,
      name: `Variable ${setup.variables.length + 1}`,
      physicalQuantity: "",
      unit: "",
      type: "ONLINE",
      equipment: "Simulation"
    }
    setSetup({ ...setup, variables: [...setup.variables, newVariable] })
  }

  const updateVariable = (id: string, updatedVariable: Partial<Variable>) => {
    setSetup({
      ...setup,
      variables: setup.variables.map(v => v.id === id ? { ...v, ...updatedVariable } : v)
    })
  }

  const deleteVariable = (id: string) => {
    setSetup({
      ...setup,
      variables: setup.variables.filter(v => v.id !== id),
      phases: setup.phases.map(p => ({
        ...p,
        variableIds: p.variableIds.filter(vId => vId !== id)
      })),
      errors: setup.errors.map(e => ({
        ...e,
        affectedVariables: e.affectedVariables.filter(vId => vId !== id)
      }))
    })
  }

  const addPhase = () => {
    const newPhase: Phase = {
      id: `phase-${Date.now()}`,
      name: `Phase ${setup.phases.length + 1}`,
      duration: 3600,
      variableIds: []
    }
    setSetup({ ...setup, phases: [...setup.phases, newPhase] })
  }

  const updatePhase = (id: string, updatedPhase: Partial<Phase>) => {
    setSetup({
      ...setup,
      phases: setup.phases.map(p => p.id === id ? { ...p, ...updatedPhase } : p)
    })
  }

  const deletePhase = (id: string) => {
    setSetup({
      ...setup,
      phases: setup.phases.filter(p => p.id !== id),
      errors: setup.errors.map(e => ({
        ...e,
        affectedPhases: e.affectedPhases.filter(pId => pId !== id)
      }))
    })
  }

  const addError = () => {
    const newError: Error = {
      id: `error-${Date.now()}`,
      type: "sudden",
      affectedPhases: [],
      affectedVariables: [],
      errorValue: 0,
      severity: "low"
    }
    setSetup({ ...setup, errors: [...setup.errors, newError] })
  }

  const updateError = (id: string, updatedError: Partial<Error>) => {
    setSetup({
      ...setup,
      errors: setup.errors.map(e => e.id === id ? { ...e, ...updatedError } : e)
    })
  }

  const deleteError = (id: string) => {
    setSetup({
      ...setup,
      errors: setup.errors.filter(e => e.id !== id)
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">Bioprocess Simulation Dataset Creator</h1>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>General Simulation Setup</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="time-interval">Time Interval (seconds)</Label>
                <Input
                  id="time-interval"
                  type="number"
                  value={setup.timeInterval}
                  onChange={(e) => setSetup({ ...setup, timeInterval: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="total-duration">Total Duration (seconds)</Label>
                <Input
                  id="total-duration"
                  type="number"
                  value={setup.totalDuration}
                  onChange={(e) => setSetup({ ...setup, totalDuration: Number(e.target.value) })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Variables</span>
              <Button onClick={addVariable}>Add Variable</Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {setup.variables.map((variable) => (
              <div key={variable.id} className="mb-4 p-4 border rounded">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`variable-${variable.id}-name`}>Name *</Label>
                    <Input
                      id={`variable-${variable.id}-name`}
                      value={variable.name}
                      onChange={(e) => updateVariable(variable.id, { name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor={`variable-${variable.id}-quantity`}>Physical Quantity *</Label>
                    <Input
                      id={`variable-${variable.id}-quantity`}
                      value={variable.physicalQuantity}
                      onChange={(e) => updateVariable(variable.id, { physicalQuantity: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor={`variable-${variable.id}-unit`}>Unit *</Label>
                    <Input
                      id={`variable-${variable.id}-unit`}
                      value={variable.unit}
                      onChange={(e) => updateVariable(variable.id, { unit: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Type *</Label>  {/* No need to use htmlFor if Select doesn't support id */}
                    <Select
                      value={variable.type}
                      onValueChange={(value: "ONLINE" | "SETPOINT") => updateVariable(variable.id, { type: value })}
                      required
                    >
                      <option value="ONLINE">ONLINE (sensor)</option>
                      <option value="SETPOINT">SETPOINT (target)</option>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor={`variable-${variable.id}-equipment`}>Equipment *</Label>
                    <Input
                      id={`variable-${variable.id}-equipment`}
                      value={variable.equipment}
                      onChange={(e) => updateVariable(variable.id, { equipment: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="mt-2">
                  <Label htmlFor={`variable-${variable.id}-description`}>Description</Label>
                  <Textarea
                    id={`variable-${variable.id}-description`}
                    value={variable.description}
                    onChange={(e) => updateVariable(variable.id, { description: e.target.value })}
                  />
                </div>
                <Button variant="destructive" onClick={() => deleteVariable(variable.id)} className="mt-2">
                  Delete Variable
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Phases</span>
              <Button onClick={addPhase}>Add Phase</Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {setup.phases.map((phase) => (
              <div key={phase.id} className="mb-4 p-4 border rounded">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`phase-${phase.id}-name`}>Name *</Label>
                    <Input
                      id={`phase-${phase.id}-name`}
                      value={phase.name}
                      onChange={(e) => updatePhase(phase.id, { name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor={`phase-${phase.id}-duration`}>Duration (seconds) *</Label>
                    <Input
                      id={`phase-${phase.id}-duration`}
                      type="number"
                      value={phase.duration}
                      onChange={(e) => updatePhase(phase.id, { duration: Number(e.target.value) })}
                      required
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <Label>Variables in this phase</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-2">
                    {setup.variables.map((variable) => (
                      <div key={variable.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`phase-${phase.id}-variable-${variable.id}`}
                          checked={phase.variableIds.includes(variable.id)}
                          onCheckedChange={(checked) => {
                            const newVariableIds = checked
                              ? [...phase.variableIds, variable.id]
                              : phase.variableIds.filter(id => id !== variable.id)
                            updatePhase(phase.id, { variableIds: newVariableIds })
                          }}
                        />
                        <Label htmlFor={`phase-${phase.id}-variable-${variable.id}`}>{variable.name}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <Button variant="destructive" onClick={() => deletePhase(phase.id)} className="mt-4">
                  Delete Phase
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex justify-between items-center">
              <span>Error Simulation</span>
              <Button onClick={addError}>Add Error</Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {setup.errors.map((error) => (
              <div key={error.id} className="mb-4 p-4 border rounded">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Error Type</Label>
                    <div className="grid grid-cols-1 gap-2 mt-2">
                      {errorTypes.map((et) => (
                        <div key={et.type} className="flex items-center space-x-2">
                          <Checkbox
                            id={`error-${error.id}-type-${et.type}`}
                            checked={error.type === et.type}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                updateError(error.id, { type: et.type })
                              }
                            }}
                          />
                          <Label htmlFor={`error-${error.id}-type-${et.type}`} className="flex-1">
                            {et.type.charAt(0).toUpperCase() + et.type.slice(1)} - {et.description}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor={`error-${error.id}-start`}>Start Time (seconds)</Label>
                    <Input
                      id={`error-${error.id}-start`}
                      type="number"
                      value={error.startTime}
                      onChange={(e) => updateError(error.id, { startTime: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`error-${error.id}-end`}>End Time (seconds)</Label>
                    <Input
                      id={`error-${error.id}-end`}
                      type="number"
                      value={error.endTime}
                      onChange={(e) => updateError(error.id, { endTime: Number(e.target.value) })}
                    />
                  </div>
                  {error.type === "intermittent" && (
                    <div>
                      <Label htmlFor={`error-${error.id}-frequency`}>Frequency (seconds)</Label>
                      <Input
                        id={`error-${error.id}-frequency`}
                        type="number"
                        value={error.frequency}
                        onChange={(e) => updateError(error.id, { frequency: Number(e.target.value) })}
                      />
                    </div>
                  )}
                  <div>
                    <Label htmlFor={`error-${error.id}-value`}>Error Value</Label>
                    <Input
                      id={`error-${error.id}-value`}
                      type="number"
                      value={error.errorValue}
                      onChange={(e) => updateError(error.id, { errorValue: Number(e.target.value) })}
                    />
                  </div>
                  <div>
                    <Label>Error Severity</Label>  {/* No need for htmlFor without id */}
                    <Select
                      value={error.severity}
                      onValueChange={(value: "low" | "medium" | "high") => updateError(error.id, { severity: value })}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </Select>
                  </div>
                </div>
                <div className="mt-4">
                  <Label>Affected Phases</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-2">
                    {setup.phases.map((phase) => (
                      <div key={phase.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`error-${error.id}-phase-${phase.id}`}
                          checked={error.affectedPhases.includes(phase.id)}
                          onCheckedChange={(checked) => {
                            const newAffectedPhases = checked
                              ? [...error.affectedPhases, phase.id]
                              : error.affectedPhases.filter(id => id !== phase.id)
                            updateError(error.id, { affectedPhases: newAffectedPhases })
                          }}
                        />
                        <Label htmlFor={`error-${error.id}-phase-${phase.id}`}>{phase.name}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4">
                  <Label>Affected Variables</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-2">
                    {setup.variables.map((variable) => (
                      <div key={variable.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`error-${error.id}-variable-${variable.id}`}
                          checked={error.affectedVariables.includes(variable.id)}
                          onCheckedChange={(checked) => {
                            const newAffectedVariables = checked
                              ? [...error.affectedVariables, variable.id]
                              : error.affectedVariables.filter(id => id !== variable.id)
                            updateError(error.id, { affectedVariables: newAffectedVariables })
                          }}
                        />
                        <Label htmlFor={`error-${error.id}-variable-${variable.id}`}>{variable.name}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="mt-4">
                  <Label htmlFor={`error-${error.id}-description`}>Error Description</Label>
                  <Textarea
                    id={`error-${error.id}-description`}
                    value={error.description}
                    onChange={(e) => updateError(error.id, { description: e.target.value })}
                  />
                </div>
                <Button variant="destructive" onClick={() => deleteError(error.id)} className="mt-4">
                  Delete Error
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        <Button className="w-full" onClick={generateDataset}> Generate Dataset </Button>

      </main>

      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center text-sm text-gray-500">
          <p>Version 1.0.0</p>
          <a href="#" className="hover:text-gray-700">
            Help & Documentation
          </a>
        </div>
      </footer>
    </div>
  )
}