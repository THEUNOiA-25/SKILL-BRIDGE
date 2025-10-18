import React, { useState } from 'react';

const Pricing = () => {
  const [isYearly, setIsYearly] = useState(true);

  const plans = [
    {
      name: "Basic",
      description: "For small teams & startups",
      price: "₹1999.99",
      features: [
        "Up to 5 users",
        "Unlimited Tasks & Projects",
        "Basic Task Board & Calendar View",
        "File Sharing & Attachments",
        "Real-Time Notifications"
      ]
    },
    {
      name: "Advance",
      description: "For large teams & enterprises",
      price: "₹3499.00",
      features: [
        "Unlimited Users",
        "All Growth Features",
        "Custom Workflows & Dashboards",
        "Dedicated Account Manager",
        "24/7 Priority Support"
      ]
    }
  ];

  return (
    <section className="bg-white flex w-full flex-col items-center pt-[142px] px-20 max-md:max-w-full max-md:pt-[100px] max-md:px-5">
      <div className="flex w-[1040px] max-w-full flex-col items-stretch">
        <div className="flex w-[716px] max-w-full flex-col mr-[42px] max-md:mr-2.5">
          <h2 className="text-[rgba(18,10,11,1)] text-[53px] font-bold leading-none tracking-[-1.5px] text-center max-md:max-w-full max-md:text-[40px] animate-fade-up">
            Affordable Courses
          </h2>
          <p className="text-[rgba(69,65,64,1)] text-[17px] font-normal leading-[31px] text-center ml-[95px] mt-[55px] max-md:ml-2.5 max-md:mt-10 animate-fade-up animation-delay-200">
            all with THEUNOiA task management solution
          </p>
          <div className="flex w-[628px] max-w-full items-stretch gap-5 flex-wrap justify-between mt-[52px] max-md:mt-10">
            <div className="flex items-stretch gap-[17px] mt-2">
              <div className="text-[rgba(18,10,11,1)] text-[15px] font-medium leading-loose grow my-auto">
                Monthly
              </div>
              <button 
                onClick={() => setIsYearly(!isYearly)}
                className="bg-[rgba(248,244,241,1)] flex flex-col justify-center p-1 rounded-[500px]"
                aria-label="Toggle pricing period"
              >
                <div className={`w-[22px] h-[22px] rounded-[50px] transition-colors ${isYearly ? 'bg-[rgba(43,216,134,1)]' : 'bg-gray-400'}`} />
              </button>
              <div className="text-[rgba(18,10,11,1)] text-[15px] font-medium leading-loose my-auto">
                Yearly
              </div>
              <div className="bg-[rgba(89,82,255,1)] flex flex-col items-stretch text-sm text-white font-normal leading-loose justify-center px-3.5 py-[11px] rounded-[50px]">
                <div>Save 20%</div>
              </div>
            </div>
            <img
              src="https://api.builder.io/api/v1/image/assets/TEMP/d2dcfce946081ba08b75aa1f6aa912226b75ec0e?placeholderIfAbsent=true"
              alt="Pricing decoration"
              className="aspect-[1.33] object-contain w-20 shrink-0"
            />
          </div>
        </div>
        <div className="mt-[30px] max-md:max-w-full">
          <div className="gap-5 flex max-md:flex-col max-md:items-stretch">
            {plans.map((plan, index) => (
              <article key={index} className="w-6/12 max-md:w-full max-md:ml-0">
                <div className={`bg-[rgba(248,244,241,1)] flex w-full flex-col mx-auto p-10 rounded-[32px] max-md:max-w-full max-md:mt-10 max-md:px-5 hover-lift animate-scale-in ${index === 0 ? 'animation-delay-400' : 'animation-delay-600'}`}>
                  <div className="bg-white self-stretch flex w-full flex-col overflow-hidden pl-4 pr-20 py-6 rounded-3xl max-md:pr-5">
                    <div className="bg-[rgba(255,216,111,1)] flex w-[89px] flex-col text-[17px] text-[rgba(18,10,11,1)] font-bold whitespace-nowrap leading-loose justify-center px-4 py-[13px] rounded-[100px] max-md:pr-5">
                      <div>{plan.name}</div>
                    </div>
                    <div className="text-[rgba(69,65,64,1)] text-[15px] font-medium leading-loose mt-4">
                      {plan.description}
                    </div>
                    <div className="flex items-stretch gap-1.5 mt-[30px]">
                      <div className="text-[rgba(18,10,11,1)] text-[37px] font-bold leading-none tracking-[-1px] grow">
                        {plan.price}
                      </div>
                      <div className="text-[rgba(69,65,64,1)] text-[15px] font-medium leading-[27px] my-auto">
                        per course
                      </div>
                    </div>
                  </div>
                  <div className="mt-[35px] space-y-[23px]">
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-stretch gap-2 text-[15px] text-[rgba(69,65,64,1)] font-medium leading-loose">
                        <img
                          src="https://api.builder.io/api/v1/image/assets/TEMP/170f0659d16144b9d3592ed92872205b55c43a75?placeholderIfAbsent=true"
                          alt="Check mark"
                          className="aspect-[1] object-contain w-5 shrink-0 rounded-[100px]"
                        />
                        <div className="my-auto">{feature}</div>
                      </div>
                    ))}
                  </div>
                  <button className="bg-[rgba(18,10,11,1)] self-stretch flex flex-col overflow-hidden items-center text-[15px] text-white font-bold leading-[1.8] justify-center mt-9 px-[70px] py-5 rounded-[100px] max-md:px-5 hover:bg-gray-800 hover:scale-105 transition-all duration-300">
                    Select Plan
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
