import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Encaja · Selecció amb criteri', description: 'Compara candidatures amb criteris transparents i evidències del CV.' };
export default function Layout({ children }: { children: React.ReactNode }) {
  return <html lang="ca"><body>{children}</body></html>;
}
