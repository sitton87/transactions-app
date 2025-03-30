// src/components/Layout.jsx
export default function Layout({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="flex items-center justify-between p-2 md:p-4 bg-white shadow fixed top-0 right-0 w-full z-30">
        <div className="flex items-center">
          {/* לוגו קטן יותר במובייל, גדול יותר במחשב */}
          <img
            src={logoImage}
            alt="לוגו עזרה לזולת"
            className="h-5 w-5 md:h-8 md:w-8 object-contain ml-2"
          />
          <h1 className="text-base md:text-lg font-bold">עזרה לזולת</h1>
        </div>

        {/* כפתור תפריט רק במובייל */}
        <button
          onClick={toggleMenu}
          className="block md:hidden"
          aria-label="תפריט"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* תפריט אופקי שמופיע רק במחשב */}
        <nav className="hidden md:flex space-x-4">
          {navItems.map(({ path, label, icon }) => (
            <Link
              key={path}
              to={path}
              className={`flex items-center px-3 py-2 rounded transition ${
                location.pathname === path
                  ? "bg-blue-100 text-blue-800"
                  : "hover:bg-gray-100"
              }`}
            >
              <span className="ml-2">{icon}</span>
              <span>{label}</span>
            </Link>
          ))}
        </nav>
      </header>

      {/* תפריט נייד שמופיע רק במובייל כשפותחים אותו */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={closeMenu}
        />
      )}

      {isOpen && (
        <div className="fixed top-16 right-0 bg-white shadow-lg z-40 w-64 md:hidden">
          <ul className="py-2">
            {navItems.map(({ path, label, icon }) => (
              <li key={path}>
                <Link
                  to={path}
                  onClick={closeMenu}
                  className={`flex items-center px-4 py-3 border-b border-gray-100 ${
                    location.pathname === path ? "bg-blue-50 text-blue-800" : ""
                  }`}
                >
                  <span className="mr-3">{icon}</span>
                  <span>{label}</span>
                </Link>
              </li>
            ))}
            <li>
              <button
                onClick={() => alert("התנתקות עדיין לא פעילה")}
                className="flex items-center px-4 py-3 w-full text-right"
              >
                <span className="mr-3">
                  <LogOut />
                </span>
                <span>התנתק</span>
              </button>
            </li>
          </ul>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 mt-16 p-2 md:p-4 overflow-auto">{children}</main>
    </div>
  );
}
