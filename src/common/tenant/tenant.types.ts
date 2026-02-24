export type TenantStatus = 'active' | 'suspended';

export type TenantContext = {
  id: string;
  slug: string;
  name: string;
  status: TenantStatus;
};
