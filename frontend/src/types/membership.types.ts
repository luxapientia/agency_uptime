export interface MembershipPlan {
  id: string;
  name: string;
  price: number;
  title: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserMembership {
  id: string;
  userId: string;
  membershipPlanId: string;
  membershipPlan: MembershipPlan;
  startDate: string;
  endDate: string;
}

export interface MembershipPlansResponse {
  plans: MembershipPlan[];
  bundlePrice: number;
  totalPrice: number;
  savings: number;
}

export interface MembershipState {
  plans: MembershipPlan[];
  bundlePrice: number;
  totalPrice: number;
  savings: number;
  userMemberships: UserMembership[];
  isLoading: boolean;
  error: string | null;
  selectedPlan: MembershipPlan | null;
}

export interface CreateMembershipData {
  membershipPlanId: string;
  endDate: string;
}

export interface UpdateMembershipData {
  endDate?: string;
} 