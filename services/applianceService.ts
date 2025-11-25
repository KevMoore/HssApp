/**
 * Appliance service
 * Provides appliance data for the appliance selection modal
 */

export interface Appliance {
	id: string;
	name: string;
	value: string; // URL-friendly value (e.g., "ariston", "worcester")
	imageUrl: string; // Stock image placeholder for now
}

// Mock appliance data based on the website list
// Using diverse Unsplash images of heating systems, boilers, and home appliances
// Each brand has a unique image for visual variety in the demo
const mockAppliances: Appliance[] = [
	{
		id: 'alpha',
		name: 'ALPHA',
		value: 'alpha',
		imageUrl:
			'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&q=80',
	},
	{
		id: 'ariston',
		name: 'ARISTON',
		value: 'ariston',
		imageUrl:
			'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=400&h=400&fit=crop&q=80',
	},
	{
		id: 'baxi',
		name: 'BAXI',
		value: 'baxi',
		imageUrl:
			'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=400&fit=crop&q=80',
	},
	{
		id: 'chaffoteaux',
		name: 'CHAFFOTEAUX',
		value: 'chaffoteaux',
		imageUrl:
			'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&q=80',
	},
	{
		id: 'eogb',
		name: 'EOGB',
		value: 'eogb',
		imageUrl:
			'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=400&h=400&fit=crop&q=80',
	},
	{
		id: 'ferroli',
		name: 'FERROLI',
		value: 'ferroli',
		imageUrl:
			'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=400&fit=crop&q=80',
	},
	{
		id: 'gledhill',
		name: 'GLEDHILL',
		value: 'gledhill',
		imageUrl:
			'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=400&h=400&fit=crop&q=80',
	},
	{
		id: 'glowworm',
		name: 'GLOWWORM',
		value: 'glowworm',
		imageUrl:
			'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=400&fit=crop&q=80',
	},
	{
		id: 'grant',
		name: 'GRANT',
		value: 'grant',
		imageUrl:
			'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&q=80',
	},
	{
		id: 'ideal',
		name: 'IDEAL',
		value: 'ideal',
		imageUrl:
			'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=400&h=400&fit=crop&q=80',
	},
	{
		id: 'ideal-commercial',
		name: 'IDEAL COMMERCIAL',
		value: 'ideal-commercial',
		imageUrl:
			'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=400&fit=crop&q=80',
	},
	{
		id: 'intergas',
		name: 'INTERGAS',
		value: 'intergas',
		imageUrl:
			'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&q=80',
	},
	{
		id: 'main',
		name: 'MAIN',
		value: 'main',
		imageUrl:
			'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=400&h=400&fit=crop&q=80',
	},
	{
		id: 'myson',
		name: 'MYSON',
		value: 'myson',
		imageUrl:
			'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=400&fit=crop&q=80',
	},
	{
		id: 'nuway',
		name: 'NUWAY',
		value: 'nuway',
		imageUrl:
			'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&q=80',
	},
	{
		id: 'powermax',
		name: 'POWERMAX',
		value: 'powermax',
		imageUrl:
			'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=400&h=400&fit=crop&q=80',
	},
	{
		id: 'ravenheat',
		name: 'RAVENHEAT',
		value: 'ravenheat',
		imageUrl:
			'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=400&fit=crop&q=80',
	},
	{
		id: 'regin',
		name: 'REGIN',
		value: 'regin',
		imageUrl:
			'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&q=80',
	},
	{
		id: 'thorn',
		name: 'THORN',
		value: 'thorn',
		imageUrl:
			'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=400&h=400&fit=crop&q=80',
	},
	{
		id: 'uncategorised',
		name: 'Uncategorised',
		value: 'uncategorised',
		imageUrl:
			'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=400&fit=crop&q=80',
	},
	{
		id: 'vaillant',
		name: 'VAILLANT',
		value: 'vaillant',
		imageUrl:
			'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&q=80',
	},
	{
		id: 'viessmann',
		name: 'VIESSMANN',
		value: 'viessmann',
		imageUrl:
			'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=400&h=400&fit=crop&q=80',
	},
	{
		id: 'worcester',
		name: 'WORCESTER',
		value: 'worcester',
		imageUrl:
			'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=400&fit=crop&q=80',
	},
];

/**
 * Get all available appliances
 */
export function getAllAppliances(): Appliance[] {
	return mockAppliances;
}

/**
 * Get appliance by value
 */
export function getApplianceByValue(value: string): Appliance | undefined {
	return mockAppliances.find((appliance) => appliance.value === value);
}
