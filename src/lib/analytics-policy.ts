export const analyticsFreeRoutes = ['/studio/diagnosis'] as const;

export function localAnalyticsIsSuppressed(pathname: string): boolean {
  return analyticsFreeRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}
