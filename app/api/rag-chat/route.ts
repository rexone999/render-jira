import { NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'

export async function POST(req: Request) {
  try {
    const { message } = await req.json()

    // Get the absolute path to gemini_test.py
    const scriptPath = path.join(process.cwd(), 'gemini_test.py')

    return new Promise((resolve) => {
      // Create a Python process to run gemini_test.py
      const pythonProcess = spawn('python', [scriptPath])

      let responseData = ''
      let errorData = ''

      // Handle Python script output
      pythonProcess.stdout.on('data', (data) => {
        responseData += data.toString()
      })

      pythonProcess.stderr.on('data', (data) => {
        errorData += data.toString()
        console.error('Python Error:', data.toString())
      })

      // Send the message to the Python script
      pythonProcess.stdin.write(message + '\n')
      pythonProcess.stdin.end()

      // Handle process completion
      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('Python process exited with code:', code)
          console.error('Error output:', errorData)
          resolve(NextResponse.json({ error: 'Error processing request' }, { status: 500 }))
          return
        }

        if (errorData) {
          console.error('Python script error:', errorData)
          resolve(NextResponse.json({ error: 'Error processing request' }, { status: 500 }))
          return
        }

        resolve(NextResponse.json({ response: responseData }))
      })

      // Handle process errors
      pythonProcess.on('error', (err) => {
        console.error('Failed to start Python process:', err)
        resolve(NextResponse.json({ error: 'Failed to start Python process' }, { status: 500 }))
      })
    })
  } catch (error) {
    console.error('Error in RAG chat endpoint:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 