export const isComponentId = (component: string): boolean => {
    const trimmed = component.trim();
    if (trimmed.length < 20) return false;
    const alphanumericRatio = trimmed.replace(/[^a-zA-Z0-9]/g, '').length / trimmed.length;
    const hasCommonWords = /\b(app|component|module|lib|util|helper|service|api|auth|db|data|ui|view|page|layout|widget|plugin|addon|extension)\b/i.test(trimmed);
    return alphanumericRatio > 0.8 && !hasCommonWords;
};