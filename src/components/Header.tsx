import React from 'react';
import theunoiaLogo from '@/assets/theunoia-logo.png';

const Header = () => {
  return (
    <header className="bg-white self-stretch w-full text-[15px] whitespace-nowrap max-md:max-w-full">
      <div className="bg-white flex w-full items-stretch gap-5 flex-wrap justify-between px-20 py-6 max-md:max-w-full max-md:px-5">
        <nav className="flex items-stretch gap-12 text-foreground font-medium flex-wrap my-auto max-md:max-w-full">
          <div className="flex items-center gap-2">
            <img
              src={theunoiaLogo}
              alt="THEUNOiA Logo"
              className="h-14 object-contain object-left"
            />
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
