// @ts-nocheck
import {
  PlusIcon,
  DocumentTextIcon,
  BuildingLibraryIcon,
  CodeBracketIcon,
  Cog6ToothIcon,
  ArchiveBoxIcon,
  QrCodeIcon,
  ChartBarIcon,
  MegaphoneIcon,
  WalletIcon,
  ClockIcon,
  UserGroupIcon,
  PhotoIcon,
  PuzzlePieceIcon,
  TagIcon
} from "@heroicons/react/24/outline"

export interface NavigationItem {
  id: string
  title: string
  icon: any
  hasSecondary?: boolean
  badge?: {
    count: number
    variant?: 'default' | 'destructive' | 'secondary'
  }
  secondaryItems?: Array<{
    id: string
    title: string
    badge?: {
      count: number
      variant?: 'default' | 'destructive' | 'secondary'
    }
  }>
}

export const navigationItems: NavigationItem[] = [
  {
    id: 'create-order',
    title: 'Create Order',
    icon: PlusIcon,
    hasSecondary: false
  },
  {
    id: 'orders',
    title: 'Orders',
    icon: ArchiveBoxIcon,
    hasSecondary: false
  },
  {
    id: 'static-qr',
    title: 'Static QR',
    icon: QrCodeIcon,
    hasSecondary: false
  },
  {
    id: 'analytics',
    title: 'Analytics',
    icon: ChartBarIcon,
    hasSecondary: false
  },
  {
    id: 'campaign',
    title: 'Campaigns',
    icon: MegaphoneIcon,
    hasSecondary: false,
    badge: {
      count: 2,
      variant: 'default'
    }
  },
  {
    id: 'koko-assets',
    title: 'Koko assets',
    icon: PhotoIcon,
    hasSecondary: false
  },
  {
    id: 'plugins',
    title: 'Plugins',
    icon: PuzzlePieceIcon,
    hasSecondary: false
  },
  {
    id: 'finance',
    title: 'Finance',
    icon: WalletIcon,
    hasSecondary: false
  },
  {
    id: 'profile-management',
    title: 'Profiles',
    icon: UserGroupIcon,
    hasSecondary: false
  },
  {
    id: 'action-history',
    title: 'Action History',
    icon: ClockIcon,
    hasSecondary: false
  }
]

// Shared grouping and order for desktop, collapsed, and mobile navigation.
// Iteration 1 only: Marketing uses the megaphone, so Campaigns gets a tag.
export const groupedItemIcons: Record<string, any> = { campaign: TagIcon }

export const navigationGroups = [
  { id: 'primary', title: '', label: 'Main navigation', items: ['create-order', 'orders', 'analytics', 'static-qr'] },
  { id: 'finance', icon: WalletIcon, title: 'Finance', label: 'Finance', items: ['financial-statement', 'bank-account', 'merchant-loans'] },
  { id: 'marketing', icon: MegaphoneIcon, title: 'Marketing', label: 'Marketing', items: ['campaign', 'koko-assets'] },
  { id: 'developers', icon: CodeBracketIcon, title: 'Developers', label: 'Developers', items: ['plugins'] },
  { id: 'administration', icon: Cog6ToothIcon, title: 'Administration', label: 'Administration', items: ['profile-management', 'action-history'] },
]


export const financeNavigationItems: NavigationItem[] = [
  { id: 'financial-statement', title: 'Financial statement', icon: DocumentTextIcon },
  { id: 'bank-account', title: 'Bank account', icon: BuildingLibraryIcon },
  { id: 'merchant-loans', title: 'Merchant loans', icon: WalletIcon },
]
