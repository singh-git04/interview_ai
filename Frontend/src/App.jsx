import {RouterProvider} from 'react-router'
import router from './app.routes'
import { AuthProvider } from './features/app/auth.context'
import { InterviewProvider } from './features/interview/interview.context'

function App() {

  return (
    
    <AuthProvider>
      <InterviewProvider>
      <RouterProvider router={router}>
    </RouterProvider>
    </InterviewProvider>
    </AuthProvider>
  )
}

export default App
