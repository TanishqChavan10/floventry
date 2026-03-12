export interface RedirectCompany {
  id: string;
  slug: string;
  role: string;
  isActive?: boolean;
}

export interface RedirectWarehouse {
  warehouseId: string;
  warehouseSlug: string;
}

export interface RedirectUser {
  activeCompanyId?: string;
  companies?: RedirectCompany[];
  warehouses?: RedirectWarehouse[];
  defaultWarehouseId?: string;
}

function getTargetCompany(user: RedirectUser, preferredCompanySlug?: string) {
  if (preferredCompanySlug) {
    const preferredCompany = user.companies?.find((company) => company.slug === preferredCompanySlug);
    if (preferredCompany) return preferredCompany;
  }

  return (
    (user.activeCompanyId
      ? user.companies?.find((company) => company.id === user.activeCompanyId)
      : undefined) ||
    user.companies?.find((company) => company.isActive) ||
    user.companies?.[0]
  );
}

function getPreferredWarehouseSlug(user: RedirectUser) {
  const defaultWarehouse = user.defaultWarehouseId
    ? user.warehouses?.find((warehouse) => warehouse.warehouseId === user.defaultWarehouseId)
    : undefined;

  if (defaultWarehouse?.warehouseSlug) return defaultWarehouse.warehouseSlug;

  return user.warehouses?.find((warehouse) => !!warehouse.warehouseSlug)?.warehouseSlug;
}

export function getRoleHomePath(user: RedirectUser, preferredCompanySlug?: string) {
  const company = getTargetCompany(user, preferredCompanySlug);
  if (!company?.slug) return null;

  if (company.role === 'OWNER' || company.role === 'ADMIN') {
    return `/${company.slug}/dashboard`;
  }

  if (company.role === 'MANAGER' || company.role === 'STAFF') {
    const warehouseSlug = getPreferredWarehouseSlug(user);
    if (warehouseSlug) {
      return `/${company.slug}/warehouses/${warehouseSlug}`;
    }

    return `/${company.slug}/warehouses`;
  }

  return `/${company.slug}/dashboard`;
}