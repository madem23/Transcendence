import React, { useEffect } from 'react';

interface StarFieldProps {
	selector: string;
}

const StarField: React.FC<StarFieldProps> = ({ selector }) => {
	useEffect(() => {
		const parent = document.querySelector(selector) as HTMLElement;

		const addStar = () => {
			const star = document.createElement('div');
			star.className = 'star';

			// Random position
			star.style.left = `${Math.random() * 100}vw`;
			star.style.top = `${Math.random() * 100}vh`;
			star.style.transform = `scale(0.1) translateZ(${Math.random() * -1500}px)`;

			// Random size (10px à 60px)
			const size = 10 + Math.random() * 50;
			star.style.width = size + 'px';
			star.style.height = size + 'px';

			parent.appendChild(star);

			setTimeout(() => star.remove(), 8000);
		};

		for (let i = 0; i < 150; i++) {
			addStar();
		}

		const intervalId = setInterval(addStar, 175);

		return () => {
			clearInterval(intervalId);
		};
	}, [selector]);

	return null;
};

export default StarField;
