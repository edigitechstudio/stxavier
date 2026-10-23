import { redirect } from 'next/navigation';

/** The content editor moved to /admin/cms. */
export default function ContentRedirect() {
  redirect('/admin/cms');
}
