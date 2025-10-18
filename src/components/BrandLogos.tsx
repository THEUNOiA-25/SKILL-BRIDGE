import React from 'react';

const BrandLogos = () => {
  return (
    <section className="bg-background flex w-full flex-col items-center text-lg text-foreground font-medium text-center py-20 px-5">
      <div className="flex w-full max-w-7xl flex-col items-stretch">
        <h2 className="self-center max-w-full animate-fade-up">
          Our Trusted Organisations for Internship Collaboration
        </h2>
        <img
          src="https://api.builder.io/api/v1/image/assets/TEMP/df5860177e95da2abc3fb2e4838254bcd7f80867?placeholderIfAbsent=true"
          alt="Partner organization logos"
          className="w-full mt-10 object-contain animate-fade-in animation-delay-200"
        />
      </div>
    </section>
  );
};

export default BrandLogos;
