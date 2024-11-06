import { CSSProperties, forwardRef, HTMLAttributes } from "react";

interface ParagraphProps extends HTMLAttributes<HTMLParagraphElement> {
	neon?: 'magenta' | 'blue';
	size?: 'default' | 'small' | 'xsmall';
	displayFlex?: boolean;
	align?: 'default' | 'left' | 'center';
	style?: CSSProperties;
}

interface MyCSSProperties extends React.CSSProperties {
	textShadow?: string;
	color?: string;
	fontSize?: string;
}

const Paragraph = forwardRef<HTMLParagraphElement, ParagraphProps>(
	({ className, neon, size, displayFlex = true, children, style, ...props }, ref) => {
		const neonEffect: MyCSSProperties = {
			color: '#FFFFFF',
			fontSize: '12px'
		};

		if (neon === 'magenta') {
			neonEffect.textShadow = '0px 0px 10px #F0F';
		} else if (neon === 'blue') {
			neonEffect.textShadow = '0px 0px 10px #0FF';
		}

		if (size === 'small') {
			neonEffect.fontSize = '10px';
		}

		if (size === 'xsmall') {
			neonEffect.fontSize = '8px';
		}

		const flexClass = displayFlex ? 'flex justify-center items-center' : '';

		return (
			<p
				ref={ref}
				{...props}
				style={{
					fontFamily: '"Press Start 2P"',
					...neonEffect,
					...style,
				}}
				className={`${flexClass} ${className || ''}`}
			>
				{children}
			</p>
		);
	}
);

Paragraph.displayName = 'Paragraph';

export default Paragraph;
