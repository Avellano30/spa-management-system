import { useState } from 'react'
import { DoubleNavbar } from './DoubleNavBar'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <DoubleNavbar></DoubleNavbar>
      Test
    </>
  )
}

export default App
