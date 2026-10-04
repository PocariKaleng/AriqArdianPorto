import { isOwner, json, handle } from '@/lib/blog';
export const dynamic = 'force-dynamic';
export async function GET() { return handle(async () => json({ canEdit: await isOwner(), signIn: '/signin-with-chatgpt?return_to=%2Fblog' })); }
