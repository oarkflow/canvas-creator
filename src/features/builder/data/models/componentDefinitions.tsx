import {BuilderComponent, ComponentStyles, ComponentType} from '@/features/builder/types/builder';
import {v4 as uuidv4} from 'uuid';
import {
	AlignLeft,
	Calendar,
	CalendarClock,
	Camera,
	Check,
	CheckSquare,
	ChevronDown,
	Circle,
	Columns,
	CreditCard,
	FormInput,
	Image,
	Layers,
	LayoutGrid,
	Link,
	Minus,
	MousePointer,
	Music,
	RectangleHorizontal,
	Space,
	Square,
	TextCursorInput,
	Type,
	Video,
} from 'lucide-react';

export interface ComponentDefinition {
	type: ComponentType;
	label: string;
	icon: React.ComponentType<{ className?: string }>;
	defaultProps: BuilderComponent['props'];
	defaultStyles: ComponentStyles;
	isContainer?: boolean;
	category: 'layout' | 'basic' | 'form' | 'media';
}

export const componentDefinitions: ComponentDefinition[] = [
	// Layout components
	{
		type: 'row',
		label: 'Row',
		icon: Columns,
		defaultProps: {},
		defaultStyles: {
			padding: '16px',
			gap: '16px',
			flexDirection: 'row',
			justifyContent: 'start',
			alignItems: 'stretch',
		},
		isContainer: true,
		category: 'layout',
	},
	{
		type: 'column',
		label: 'Column',
		icon: RectangleHorizontal,
		defaultProps: {},
		defaultStyles: {
			padding: '16px',
			width: 'auto',
			columnSpan: 1,
			backgroundColor: '#252538',
			borderRadius: '8px',
		},
		isContainer: true,
		category: 'layout',
	},
	{
		type: 'container',
		label: 'Container',
		icon: Square,
		defaultProps: {},
		defaultStyles: {
			padding: '24px',
			backgroundColor: '#1a1a2e',
			borderRadius: '8px',
		},
		isContainer: true,
		category: 'layout',
	},
	{
		type: 'card',
		label: 'Card',
		icon: CreditCard,
		defaultProps: {},
		defaultStyles: {
			padding: '24px',
			backgroundColor: '#252538',
			borderRadius: '12px',
		},
		isContainer: true,
		category: 'layout',
	},
	{
		type: 'grid',
		label: 'Grid',
		icon: LayoutGrid,
		defaultProps: {},
		defaultStyles: {
			gap: '16px',
			columns: 2,
		},
		isContainer: true,
		category: 'layout',
	},
	{
		type: 'hero',
		label: 'Hero Section',
		icon: Layers,
		defaultProps: {
			content: 'Hero Section',
		},
		defaultStyles: {
			padding: '80px 24px',
			backgroundColor: '#1a1a2e',
			textAlign: 'center',
		},
		isContainer: true,
		category: 'layout',
	},
	// Basic components
	{
		type: 'heading',
		label: 'Heading',
		icon: Type,
		defaultProps: {
			content: 'Heading Text',
			level: 1,
		},
		defaultStyles: {
			fontSize: '32px',
			fontWeight: '700',
			margin: '0 0 16px 0',
		},
		category: 'basic',
	},
	{
		type: 'paragraph',
		label: 'Paragraph',
		icon: AlignLeft,
		defaultProps: {
			content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
		},
		defaultStyles: {
			fontSize: '16px',
			margin: '0 0 16px 0',
		},
		category: 'basic',
	},
	{
		type: 'button',
		label: 'Button',
		icon: MousePointer,
		defaultProps: {
			content: 'Click Me',
			variant: 'primary',
		},
		defaultStyles: {
			padding: '12px 24px',
			borderRadius: '8px',
		},
		category: 'basic',
	},
	{
		type: 'image',
		label: 'Image',
		icon: Image,
		defaultProps: {
			src: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=400&fit=crop',
			alt: 'Placeholder image',
		},
		defaultStyles: {
			width: '100%',
			borderRadius: '8px',
		},
		category: 'basic',
	},
	{
		type: 'divider',
		label: 'Divider',
		icon: Minus,
		defaultProps: {},
		defaultStyles: {
			margin: '24px 0',
		},
		category: 'basic',
	},
	{
		type: 'spacer',
		label: 'Spacer',
		icon: Space,
		defaultProps: {},
		defaultStyles: {
			height: '48px',
		},
		category: 'basic',
	},
	// Form components
	{
		type: 'input',
		label: 'Text Input',
		icon: FormInput,
		defaultProps: {
			placeholder: 'Enter text...',
			label: 'Label',
			name: 'input-field',
			inputType: 'text',
		},
		defaultStyles: {
			width: '100%',
			padding: '12px 16px',
			borderRadius: '8px',
			borderColor: '#374151',
			borderWidth: '1px',
			backgroundColor: '#1a1a2e',
		},
		category: 'form',
	},
	{
		type: 'textarea',
		label: 'Text Area',
		icon: TextCursorInput,
		defaultProps: {
			placeholder: 'Enter your message...',
			label: 'Message',
			name: 'textarea-field',
		},
		defaultStyles: {
			width: '100%',
			height: '120px',
			padding: '12px 16px',
			borderRadius: '8px',
			borderColor: '#374151',
			borderWidth: '1px',
			backgroundColor: '#1a1a2e',
		},
		category: 'form',
	},
	{
		type: 'select',
		label: 'Dropdown',
		icon: ChevronDown,
		defaultProps: {
			placeholder: 'Select an option',
			label: 'Select',
			name: 'select-field',
			options: [
				{ label: 'Option 1', value: 'option-1' },
				{ label: 'Option 2', value: 'option-2' },
				{ label: 'Option 3', value: 'option-3' },
			],
			multiSelect: false,
			filterable: false,
		},
		defaultStyles: {
			width: '100%',
			padding: '12px 16px',
			borderRadius: '8px',
			borderColor: '#374151',
			borderWidth: '1px',
			backgroundColor: '#1a1a2e',
		},
		category: 'form',
	},
	{
		type: 'checkbox',
		label: 'Checkbox',
		icon: CheckSquare,
		defaultProps: {
			label: 'I agree to terms',
			name: 'checkbox-field',
		},
		defaultStyles: {
			padding: '8px 0',
		},
		category: 'form',
	},
	{
		type: 'radio',
		label: 'Radio Group',
		icon: Circle,
		defaultProps: {
			label: 'Choose one',
			name: 'radio-field',
			options: [
				{ label: 'Option A', value: 'a' },
				{ label: 'Option B', value: 'b' },
				{ label: 'Option C', value: 'c' },
			],
		},
		defaultStyles: {
			padding: '8px 0',
		},
		category: 'form',
	},
	{
		type: 'date',
		label: 'Date Picker',
		icon: Calendar,
		defaultProps: {
			placeholder: 'Select date',
			label: 'Date',
			name: 'date-field',
		},
		defaultStyles: {
			width: '100%',
			padding: '12px 16px',
			borderRadius: '8px',
			borderColor: '#374151',
			borderWidth: '1px',
			backgroundColor: '#1a1a2e',
		},
		category: 'form',
	},
	{
		type: 'datetime',
		label: 'Date & Time',
		icon: CalendarClock,
		defaultProps: {
			placeholder: 'Select date & time',
			label: 'Date & Time',
			name: 'datetime-field',
		},
		defaultStyles: {
			width: '100%',
			padding: '12px 16px',
			borderRadius: '8px',
			borderColor: '#374151',
			borderWidth: '1px',
			backgroundColor: '#1a1a2e',
		},
		category: 'form',
	},
	// Media components
	{
		type: 'anchor',
		label: 'Link',
		icon: Link,
		defaultProps: {
			content: 'Click here',
			href: '#',
			target: '_self',
		},
		defaultStyles: {
			fontSize: '16px',
			textColor: '#22d3ee',
		},
		category: 'media',
	},
	{
		type: 'video',
		label: 'Video',
		icon: Video,
		defaultProps: {
			src: 'https://www.w3schools.com/html/mov_bbb.mp4',
			controls: true,
			autoplay: false,
			loop: false,
			muted: false,
			poster: '',
		},
		defaultStyles: {
			width: '100%',
			borderRadius: '8px',
		},
		category: 'media',
	},
	{
		type: 'audio',
		label: 'Audio',
		icon: Music,
		defaultProps: {
			src: 'https://www.w3schools.com/html/horse.mp3',
			controls: true,
			autoplay: false,
			loop: false,
		},
		defaultStyles: {
			width: '100%',
		},
		category: 'media',
	},
	{
		type: 'webcam',
		label: 'Webcam',
		icon: Camera,
		defaultProps: {
			content: 'Webcam Feed',
		},
		defaultStyles: {
			width: '100%',
			height: '300px',
			borderRadius: '8px',
			backgroundColor: '#1a1a2e',
		},
		category: 'media',
	},
];

export function createComponent(type: ComponentType): BuilderComponent {
	const definition = componentDefinitions.find(d => d.type === type);
	if (!definition) {
		throw new Error(`Unknown component type: ${type}`);
	}
	
	const component: BuilderComponent = {
		id: uuidv4(),
		type,
		props: {...definition.defaultProps},
		styles: {...definition.defaultStyles},
	};
	
	// Add default children for row
	if (type === 'row') {
		component.children = [
			createComponent('column'),
			createComponent('column'),
		];
	} else if (definition.isContainer) {
		component.children = [];
	}
	
	return component;
}

export function getComponentDefinition(type: ComponentType): ComponentDefinition | undefined {
	return componentDefinitions.find(d => d.type === type);
}

export function isContainerComponent(type: ComponentType): boolean {
	const definition = componentDefinitions.find(d => d.type === type);
	return definition?.isContainer ?? false;
}
