import siteConfig from './sites.json';

export const MATCHES = siteConfig.matches || [];

function escapeRegExp(input) {
  return input.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
}

function wildcardToRegExp(pattern) {
  return new RegExp(`^${escapeRegExp(pattern).replace(/\*/g, '.*')}$`);
}

export function isSupportedPage(url = window.location.href) {
  return MATCHES.some(pattern => wildcardToRegExp(pattern).test(url));
}
