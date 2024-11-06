import React from 'react';
import Paragraph from './Paragraph';

type FooterProps = {
  className?: string;
};


const Footer: React.FC<FooterProps> = ({ className }) => {

  return (
    <div className="text-center text-white min-h-[90px] p-4 flex items-center justify-center">
      <div>
        <p className='footer-paragraph'>2023 - All rights reserved</p>
        <p className="footer-paragraph mb-[6px]">Made with passion by&nbsp;
          <a href="https://www.linkedin.com/in/fanny-lemaitre/" target="_blank" rel="noopener noreferrer" className="hover:underline">
            Fanny
          </a>,&nbsp;
          <a href="https://www.linkedin.com/in/celine-junker-6b7870106/" target="_blank" rel="noopener noreferrer" className="hover:underline">
            Céline
          </a>,&nbsp;
          <a href="https://www.linkedin.com/in/manon-demma-41708090/" target="_blank" rel="noopener noreferrer" className="hover:underline">
            Manon
          </a>&nbsp;&&nbsp;
          <a href="https://www.linkedin.com/in/benjamin-l%C3%A9otard-21b103116/" target="_blank" rel="noopener noreferrer" className="hover:underline">
            Benjamin
          </a>
        </p>
        <a href="https://github.com/FannyTM/ft_transcendence" target="_blank" rel="noopener noreferrer">
          <p className='footer-github'>View project on GitHub
            <img
              src="/Vector.svg"
              alt="GitHub Logo"
              className="px-2"
            />
          </p>
        </a>
      </div>
    </div>
  );
};

export default Footer;
