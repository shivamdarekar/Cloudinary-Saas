export default function Footer() {
  return (
    <footer className="text-center py-6 border-t border-gray-200 mt-4 bg-gradient-to-r from-blue-50 to-purple-50">
      <div className="flex items-center justify-center space-x-2">
        <span className="text-2xl animate-pulse">✨</span>
        <p className="text-sm text-gray-600">
          Crafted with <span className="text-red-500 animate-bounce inline-block">❤️</span> by{' '}
          <a 
            href="https://www.linkedin.com/in/shivam-darekar-b61636240/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 font-medium transition-all duration-300 hover:scale-105 inline-block hover:underline decoration-2 underline-offset-2"
          >
            Shivam Darekar
          </a>
        </p>
        <span className="text-2xl animate-pulse">✨</span>
      </div>
      
    </footer>
  );
}