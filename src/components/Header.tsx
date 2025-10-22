import React from 'react';

const Header = () => {
  return (
    <header className="bg-white self-stretch w-full text-[15px] whitespace-nowrap max-md:max-w-full">
      <div className="bg-white flex w-full items-stretch gap-5 flex-wrap justify-between px-20 py-6 max-md:max-w-full max-md:px-5">
        <nav className="flex items-stretch gap-12 text-foreground font-medium flex-wrap my-auto max-md:max-w-full">
          <div className="flex items-stretch gap-1 text-lg font-bold">
            <img
              src="https://api.builder.io/api/v1/image/assets/TEMP/92d972effd43063f68165dc5639029d3b68f7576?placeholderIfAbsent=true"
              alt="THEUNOiA Logo"
              className="aspect-[1.25] object-contain w-[30px] shrink-0"
            />
            <div className="my-auto">THEUNOiA</div>
          </div>
          <div className="my-auto">Work</div>
          <div className="flex items-stretch gap-8 my-auto">
            <div>Features</div>
            <div>Contacts</div>
          </div>
        </nav>
        <div className="flex items-stretch gap-4 font-bold text-center">
          <a href="/login">
            <button className="border border-foreground flex items-center justify-center text-foreground px-12 py-4 rounded-full hover:bg-secondary transition-colors">
              LogIn
            </button>
          </a>
          <a href="/signup">
            <button className="bg-primary flex items-center justify-center text-primary-foreground px-12 py-4 rounded-full hover:opacity-90 transition-opacity">
              SignUp
            </button>
          </a>
        </div>
      </div>
    </header>
  );
};

export default Header;
