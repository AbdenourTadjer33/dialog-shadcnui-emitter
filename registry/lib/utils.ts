// Dev/demo-only stub. Not a registry item — consumers get `utils` from the
// official shadcn registry via registryDependencies.
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
