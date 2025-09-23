import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Middleware Journea
        </h1>
        
        <div className="space-y-4">
          <Link 
            href="/itinerary"
            className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors block text-center"
          >
            Créer un itinéraire
          </Link>
          
          <div className="text-center text-gray-600 text-sm">
            Interface agent pour la création d'itinéraires de voyage
          </div>
        </div>
      </div>
    </div>
  )
}