import { useState } from 'react'
import { DoubleNavbar } from './DoubleNavBar'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <DoubleNavbar></DoubleNavbar>
    </>
  )
}

export default App
