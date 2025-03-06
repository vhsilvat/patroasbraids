import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <header className="mb-8 text-center">
        <h1 className="text-4xl mb-2">Patroas Braids</h1>
        <p className="text-gray-600">Especialistas em cabelos afro e tranças</p>
      </header>
      
      <main className="w-full max-w-4xl bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl mb-4">Sistema de Agendamento</h2>
        <p className="mb-4">Bem-vindo ao nosso sistema de agendamento online!</p>
        
        <div className="mt-8">
          <button 
            onClick={() => setCount((count) => count + 1)}
            className="btn btn-primary mr-2"
          >
            Incrementar: {count}
          </button>
          <button 
            className="btn btn-secondary"
          >
            Agendar Agora
          </button>
        </div>
      </main>
      
      <footer className="mt-8 text-center text-gray-500 text-sm">
        &copy; {new Date().getFullYear()} Patroas Braids. Todos os direitos reservados.
      </footer>
    </div>
  )
}

export default App