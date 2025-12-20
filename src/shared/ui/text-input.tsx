import { setup, render, bind } from '@anchorlib/react';
import type { InputHTMLAttributes } from 'react';

interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value'> {
	defaultValue?: any;
	value?: any;
	label?: string;
}

export const TextInput = setup<TextInputProps>((props) => {
	return render(() => (
		<div className="mb-4">
			{props.label && (
				<label className="block text-sm font-medium mb-1">
					{props.label}
				</label>
			)}
			<input
				{...props.$omit(["value"])}
				defaultValue={bind(props.value)}
				className={`w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 ${props.className || ''}`}
			/>
		</div>
	), 'TextInput');
}, 'TextInput');