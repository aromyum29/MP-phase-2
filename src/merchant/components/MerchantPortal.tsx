// @ts-nocheck
"use client"

import { useState, useEffect, useRef } from "react"
import {
  XMarkIcon,
  BellIcon,
  ChevronDownIcon,
  ArrowRightOnRectangleIcon,
  UserIcon,
  Bars3Icon
} from "@heroicons/react/24/outline"
import { PanelLeft } from "lucide-react"
import { Button } from "./ui/button"
import { Badge } from "./ui/badge"
import { cn } from "./ui/utils"
import { navigationItems as baseNavigationItems, navigationGroups, financeNavigationItems, type NavigationItem } from "./NavigationData"
import { ImageWithFallback } from "./figma/ImageWithFallback"
import { useTheme } from "./ThemeProvider"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu"
// PROTECTED IMPORT - NEVER REMOVE - Koko Logo
import kokoLogo from "figma:asset/09ac28c5614ff62377e494f60366a17f58f0e925.png"
import astronautBg from 'figma:asset/a349729d02e5cf57b6a622320f58be0535982d3a.png'
import { VersionSwitcher } from "./VersionSwitcher"
import { usePortalIteration } from "./IterationProvider"

import svgPaths from "../imports/svg-fxp87oqzqi"
import HIconSolidBell from "../imports/HIconSolidBell"
import { CreateOrder } from "./CreateOrder"
import { Orders } from "./Orders"
import { StaticQR } from "./StaticQR"
import { Analytics } from "./Analytics"
import { Campaign } from "./Campaign"
import { Finance } from "./Finance"
import { BankAccount } from "./BankAccount"
import { BankAccountV1 } from "./v1/BankAccountV1"
import { ModularComponents } from "./ModularComponents"
import { FeatureAnnouncement, defaultAnnouncement, type AnnouncementContent, type AnnouncementDestination } from "./FeatureAnnouncement"
import { FinanceWorkspace, type FinanceSection } from "./FinanceWorkspace"
import { MerchantLoans } from "./MerchantLoans"
import { ActionHistory } from "./ActionHistory"
import { ProfileManagement } from "./ProfileManagement"
import { KokoAssets } from "./tools/KokoAssets"
import { Plugin } from "./tools/Plugin"

interface MerchantPortalProps {
  children?: React.ReactNode
  onLogout?: () => void
}

function SunIcon() {
  return (
    <div className="relative shrink-0 size-5">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <path 
          clipRule="evenodd" 
          d={svgPaths.pe62c280} 
          fill="currentColor" 
          fillRule="evenodd" 
        />
      </svg>
    </div>
  )
}

function CustomAvatar() {
  return (
    <div className="relative h-9 w-9 rounded-full shadow-sm transition-all duration-200 hover:shadow-md hover:scale-105">
      {/* Brand accent outer border */}
      <div className="absolute inset-0 rounded-full border-2 border-[#BDDDEE]" />
      
      {/* White stroke border */}
      <div className="absolute inset-[2px] rounded-full border border-white">
        {/* Dark background with letter */}
        <div className="flex h-full w-full items-center justify-center rounded-full bg-[#2b3440] text-[#d7dde4] text-sm font-medium">
          J
        </div>
      </div>
    </div>
  )
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="h-9 w-9 p-0 rounded-xl hover:bg-sidebar-button-hover text-sidebar-foreground/70 hover:text-sidebar-foreground transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md"
    >
      {theme === "light" ? (
        <SunIcon />
      ) : (
        <MoonIcon className="h-5 w-5" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}

function UserAvatar({ onLogout }: { onLogout?: () => void }) {
  const handleLogout = () => {
    onLogout?.()
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 rounded-full p-0 hover:bg-sidebar-button-hover">
          <CustomAvatar />
          <span className="sr-only">Open user menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem className="flex items-center gap-2">
          <UserIcon className="h-4 w-4" />
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Johdoe1</p>
            <p className="text-xs leading-none text-muted-foreground">john@example.com</p>
          </div>
        </DropdownMenuItem>
        {onLogout && <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2">
          <ArrowRightOnRectangleIcon className="h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function MobileUserAvatar({ onLogout }: { onLogout?: () => void }) {
  const handleLogout = () => {
    onLogout?.()
  }

  return (
    <div className="flex items-center justify-between p-6">
      <div className="flex items-center gap-4">
        <CustomAvatar />
        <div>
          <p className="font-semibold text-base">Johdoe1</p>
          <p className="text-sm text-muted-foreground">john@example.com</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        {onLogout && (<Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="text-muted-foreground hover:text-destructive transition-colors duration-200 rounded-xl hover:bg-destructive/10"
        >
          <ArrowRightOnRectangleIcon className="h-4 w-4" />
        </Button>)}
      </div>
    </div>
  )
}



const getPageDescription = (pageId: string) => {
  switch (pageId) {
    case 'campaign':
    case 'campaign-active':
    case 'campaign-yours':
      return 'Create and manage marketing campaigns and promotions'
    case 'plugins':
      return 'Connect your website to Koko and start accepting BNPL payments'
    case 'finance':
      return 'Track payments, settlements, and financial reports'
    case 'action-history':
      return 'Review all activities and system actions'
    case 'profile-management':
      return 'Manage user accounts, roles, and permissions'
    default:
      return 'Page functionality coming soon'
  }
}

export function MerchantPortal({ children, onLogout }: MerchantPortalProps) {
  const { iteration } = usePortalIteration()
  const [currentPage, setCurrentPage] = useState('create-order')
  const [financeSection, setFinanceSection] = useState<FinanceSection>('statement')
  const previousIteration = useRef(iteration)
  const navigationItems: NavigationItem[] = iteration === '1'
    ? [...baseNavigationItems.filter(item => item.id !== 'finance'), ...financeNavigationItems]
    : baseNavigationItems
  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const createOrderCardRef = useRef<HTMLDivElement>(null)
  const [announcement, setAnnouncement] = useState<AnnouncementContent | null>(null)
  const toggleGroup = (id: string) => {
    const opening = openGroup !== id
    setOpenGroup(opening ? id : null)
    if (opening) {
      const firstItem = navigationGroups.find(group => group.id === id)?.items[0]
      if (firstItem) {
        setCurrentPage(firstItem)
        setCreateOrderStep('form')
        if (firstItem === 'campaign') setCampaignNotificationViewed(true)
      }
    }
  }
  const groupedNavigation = iteration === '2'
    ? [{ id: 'original', title: '', label: 'Main navigation', items: navigationItems }]
    : navigationGroups.map(group => ({
    ...group,
    items: group.items.flatMap(id => navigationItems.filter(item => item.id === id)),
  }))
  useEffect(() => {
    if (previousIteration.current !== iteration) {
      if (iteration === '2') {
        const financePages: Record<string, FinanceSection> = { 'financial-statement': 'statement', 'bank-account': 'bank-account', 'merchant-loans': 'merchant-loans' }
        if (financePages[currentPage]) {
          setCurrentPage('finance')
          setFinanceSection(financePages[currentPage])
        } else if (currentPage === 'modular-components') setCurrentPage('create-order')
        setAnnouncement(null)
      } else if (currentPage === 'finance') {
        setCurrentPage(financeSection === 'statement' ? 'financial-statement' : financeSection)
      }
      previousIteration.current = iteration
    }
  }, [iteration, currentPage, financeSection])
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  useEffect(() => {
    if (!isMobileMenuOpen && showMobileMenu) {
      const timer = setTimeout(() => setShowMobileMenu(false), 300)
      return () => clearTimeout(timer)
    }
  }, [isMobileMenuOpen, showMobileMenu])
  const [mobileExpandedItems, setMobileExpandedItems] = useState<Set<string>>(new Set())
  const [campaignNotificationViewed, setCampaignNotificationViewed] = useState(false)
  const [createOrderStep, setCreateOrderStep] = useState<string>('form')
  const [ordersInitialTab, setOrdersInitialTab] = useState<string | null>(null)
  const { theme } = useTheme()

  const getCurrentPageTitle = () => {
    if (currentPage === 'modular-components') return 'Modular components'
    for (const item of navigationItems) {
      if (item.id === currentPage) {
        return item.title
      }
      if (item.secondaryItems) {
        const secondaryItem = item.secondaryItems.find(sub => sub.id === currentPage)
        if (secondaryItem) {
          return secondaryItem.title
        }
      }
    }
    return 'Create Order'
  }

  const handleItemClick = (item: NavigationItem) => {
    if (item.hasSecondary) {
      const newExpanded = new Set(expandedItems)
      if (newExpanded.has(item.id)) {
        newExpanded.delete(item.id)
      } else {
        newExpanded.add(item.id)
      }
      setExpandedItems(newExpanded)
    } else {
      // Mark campaign notification as viewed when campaign page is accessed
      if (item.id === 'campaign') {
        setCampaignNotificationViewed(true)
      }
      setCurrentPage(item.id)
      setIsMobileMenuOpen(false)
      // Reset CreateOrder step when navigating away from create-order page
      if (item.id !== 'create-order') {
        setCreateOrderStep('form')
      }
    }
  }

  const handleSecondaryClick = (secondaryId: string) => {
    setCurrentPage(secondaryId)
    setIsMobileMenuOpen(false)
    // Reset CreateOrder step when navigating away from create-order page
    if (secondaryId !== 'create-order') {
      setCreateOrderStep('form')
    }
  }

  const handleMobileItemClick = (item: NavigationItem) => {
    if (item.hasSecondary) {
      const newExpanded = new Set(mobileExpandedItems)
      if (newExpanded.has(item.id)) {
        newExpanded.delete(item.id)
      } else {
        newExpanded.add(item.id)
      }
      setMobileExpandedItems(newExpanded)
    } else {
      // Mark campaign notification as viewed when campaign page is accessed
      if (item.id === 'campaign') {
        setCampaignNotificationViewed(true)
      }
      setCurrentPage(item.id)
      setIsMobileMenuOpen(false)
      // Reset CreateOrder step when navigating away from create-order page
      if (item.id !== 'create-order') {
        setCreateOrderStep('form')
      }
    }
  }

  const isItemActive = (item: NavigationItem) => {
    if (currentPage === item.id) return true
    if (item.secondaryItems) {
      return item.secondaryItems.some(sub => sub.id === currentPage)
    }
    return false
  }

  const toggleMobileMenu = () => {
    if (!isMobileMenuOpen) {
      setShowMobileMenu(true)
      requestAnimationFrame(() => {
        setIsMobileMenuOpen(true)
      })
    } else {
      setIsMobileMenuOpen(false)

    }
  }

  // Helper function to check if campaign notification should be shown
  const shouldShowCampaignNotification = (item: NavigationItem) => {
    return item.id === 'campaign' && !campaignNotificationViewed && item.badge && item.badge.count > 0
  }

  // Handle CreateOrder step changes
  const handleCreateOrderStepChange = (step: string) => {
    setCreateOrderStep(step)
  }

  // Handle navigation to orders with specific tab
  const handleNavigateToOrders = (initialTab?: string) => {
    setCurrentPage('orders')
    setOrdersInitialTab(initialTab || null)
    setIsMobileMenuOpen(false)
    // Reset CreateOrder step when navigating away from create-order page
    setCreateOrderStep('form')
  }

  const continueToCreateOrder = () => {
    setAnnouncement(null)
    setCurrentPage('create-order')
    setCreateOrderStep('form')
  }
  const exploreAnnouncementFeature = (destination: AnnouncementDestination) => {
    setAnnouncement(null)
    setCurrentPage(destination)
    setOpenGroup(destination === 'koko-assets' ? 'growth' : 'finance')
  }

  // Determine if special background should be applied
  const shouldApplySpecialBackground = currentPage === 'create-order' && createOrderStep === 'form'

  return (
    <div data-portal-iteration={iteration} className="flex h-screen bg-background overflow-x-hidden">
      {iteration === '1' && <FeatureAnnouncement open={!!announcement} onContinue={continueToCreateOrder} content={announcement ?? defaultAnnouncement} onExplore={exploreAnnouncementFeature} anchorRef={createOrderCardRef} />}
      {/* Desktop Sidebar */}
      <div
        className={cn(
          "hidden md:flex flex-shrink-0 bg-white transition-[width] duration-300 ease-in-out relative z-10",
          // Elevated sidebar — directional shadow on the right edge + subtle vertical lift
          "shadow-[6px_0_28px_-8px_rgba(15,23,42,0.12),0_4px_16px_-2px_rgba(15,23,42,0.06)]",
          isSidebarCollapsed ? "w-20" : "w-72"
        )}
      >
        <div className="flex flex-col w-full overflow-hidden">
          {/* Logo + Toggle Section */}
          <div className={cn(
            "border-b border-border/50 transition-all duration-300",
            isSidebarCollapsed ? "px-3 py-5" : "px-5 py-5"
          )}>
            {isSidebarCollapsed ? (
              <div className="flex flex-col items-center gap-3">
                <button
                  onClick={() => setIsSidebarCollapsed(false)}
                  aria-label="Expand sidebar"
                  title="Expand sidebar"
                  className="h-9 w-9 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
                >
                  <PanelLeft className="h-5 w-5 text-gray-600" />
                </button>
                {/* PROTECTED LOGO - NEVER REMOVE */}
                <div className="h-11 w-11 bg-white rounded-xl shadow-md border border-border/20 flex items-center justify-center p-1 flex-shrink-0">
                  <ImageWithFallback
                    src={kokoLogo}
                    alt="Koko Logo"
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {/* PROTECTED LOGO - NEVER REMOVE */}
                <div className="h-11 w-11 bg-white rounded-xl shadow-md border border-border/20 flex items-center justify-center p-1 flex-shrink-0">
                  <ImageWithFallback
                    src={kokoLogo}
                    alt="Koko Logo"
                    className="h-full w-full object-contain"
                  />
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-base font-bold text-sidebar-foreground leading-tight tracking-tight truncate">
                    Merchant Portal
                  </span>
                  <span className="text-xs font-medium text-sidebar-foreground/60 truncate">
                    Carnage - Colombo
                  </span>
                </div>
                <button
                  onClick={() => setIsSidebarCollapsed(true)}
                  aria-label="Collapse sidebar"
                  title="Collapse sidebar"
                  className="h-9 w-9 rounded-lg flex items-center justify-center bg-white shadow-sm border border-border/40 hover:bg-gray-50 hover:shadow-md transition-all flex-shrink-0"
                >
                  <PanelLeft className="h-5 w-5 text-gray-700" />
                </button>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className={cn(
            "flex-1 transition-all duration-300 overflow-y-auto",
            iteration === '1' ? "py-3" : "py-6",
            isSidebarCollapsed ? "px-3" : "px-6"
          )}>
            <div className="space-y-1">
              {groupedNavigation.map(group => (
                <section key={group.id} aria-label={group.label}>
                  {group.id === 'finance' && <div role="separator" className="mx-3 my-4 border-t border-border/60" />}
                  {group.title && <button type="button" onClick={() => {
                    if (isSidebarCollapsed) {
                      setIsSidebarCollapsed(false)
                      if (openGroup !== group.id) toggleGroup(group.id)
                      else {
                        setCurrentPage(group.items[0].id)
                        setCreateOrderStep('form')
                      }
                    } else toggleGroup(group.id)
                  }} aria-label={group.title} title={isSidebarCollapsed ? group.title : undefined} aria-expanded={!isSidebarCollapsed && openGroup === group.id} aria-controls={`desktop-group-${group.id}`} className={cn("flex h-10 w-full items-center rounded-lg px-3 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-button-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", isSidebarCollapsed ? "justify-center" : "gap-2.5")}>
                    <group.icon className="h-[18px] w-[18px] shrink-0 text-sidebar-foreground/60" />
                    {!isSidebarCollapsed && <><span>{group.title}</span><ChevronDownIcon className={cn("ml-auto h-3.5 w-3.5 text-sidebar-foreground/60 transition-transform", openGroup === group.id && "rotate-180")} /></>}
                  </button>}
                  <div id={`desktop-group-${group.id}`} hidden={!!group.title && (isSidebarCollapsed || openGroup !== group.id)} className={cn(iteration === '1' ? "space-y-0.5" : "space-y-1", group.title && "ml-4 border-l border-border/50 pl-1")}>
              {group.items.map((item) => (
                <div key={item.id}>
                  <button
                    onClick={() => {
                      if (item.hasSecondary) {
                        if (isSidebarCollapsed) {
                          // In collapsed mode, expand sidebar AND open the secondary
                          setIsSidebarCollapsed(false)
                          setExpandedItems(new Set([item.id]))
                          if (item.secondaryItems && item.secondaryItems.length > 0) {
                            setCurrentPage(item.secondaryItems[0].id)
                            setCreateOrderStep('form')
                          }
                          return
                        }
                        if (expandedItems.has(item.id)) {
                          const newExpanded = new Set(expandedItems)
                          newExpanded.delete(item.id)
                          setExpandedItems(newExpanded)
                        } else {
                          setExpandedItems(new Set([item.id]))
                          if (item.secondaryItems && item.secondaryItems.length > 0) {
                            setCurrentPage(item.secondaryItems[0].id)
                            setIsMobileMenuOpen(false)
                            setCreateOrderStep('form')
                          }
                        }
                      } else {
                        setExpandedItems(new Set())
                        handleItemClick(item)
                      }
                    }}
                    title={isSidebarCollapsed ? item.title : undefined}
                    aria-label={item.title}
                    aria-current={isItemActive(item) ? 'page' : undefined}
                    className={cn(
                      "w-full flex items-center text-left rounded-xl transition-all duration-200 group",
                      iteration === '1'
                        ? (isSidebarCollapsed ? "justify-center p-2.5" : "gap-2.5 px-3 py-2")
                        : (isSidebarCollapsed ? "justify-center p-3" : "gap-3 px-4 py-2.5"),
                      isItemActive(item)
                        ? "sidebar-active-gradient text-[#1f2937] shadow-md hover:shadow-lg"
                        : "text-sidebar-foreground hover:bg-sidebar-button-hover hover:shadow-md"
                    )}
                  >
                    <item.icon className={cn(
                      "flex-shrink-0 transition-transform duration-200",
                      iteration === '1' ? "h-4 w-4" : "h-5 w-5",
                      isItemActive(item)
                        ? "text-black scale-110"
                        : "text-sidebar-foreground/70 group-hover:text-sidebar-foreground"
                    )} />
                    {!isSidebarCollapsed && (
                      <>
                        <span className={cn(
                          "text-sm font-medium leading-5 transition-transform duration-200 origin-left",
                          isItemActive(item) ? (iteration === '1' ? "text-black font-semibold" : "text-black font-semibold scale-110") : "font-medium"
                        )}>
                          {item.title}
                        </span>

                        {shouldShowCampaignNotification(item) && (
                          <div className="ml-auto">
                            <div className="h-5 w-5 text-[#BDDDEE] animate-pulse">
                              <HIconSolidBell />
                            </div>
                          </div>
                        )}

                        {item.hasSecondary && item.id !== 'campaign' && (
                          <div className="ml-auto">
                            <ChevronDownIcon
                              className={cn(
                                "h-5 w-5 transition-transform duration-200",
                                isItemActive(item) ? "text-black" : "text-sidebar-foreground/60",
                                expandedItems.has(item.id) ? "rotate-180" : "rotate-0"
                              )}
                            />
                          </div>
                        )}
                      </>
                    )}
                  </button>

                  {/* Secondary Items — only shown when expanded */}
                  {!isSidebarCollapsed && item.hasSecondary && expandedItems.has(item.id) && item.id !== 'campaign' && (
                    <div className="ml-10 mt-2 space-y-1">
                      {item.secondaryItems?.map((subItem) => (
                        <button
                          key={subItem.id}
                          onClick={() => handleSecondaryClick(subItem.id)}
                          className={cn(
                            "w-full flex items-center gap-3 px-4 py-3.5 text-left rounded-xl transition-all duration-200",
                            currentPage === subItem.id
                              ? "text-black font-bold"
                              : "text-sidebar-foreground/60 font-medium hover:text-sidebar-foreground hover:bg-sidebar-button-hover"
                          )}
                        >
                          <span className={cn("text-sm leading-5", currentPage === subItem.id ? "font-bold" : "font-medium")}>{subItem.title}</span>
                          {subItem.badge && subItem.badge.count > 0 && (
                            <div className="ml-auto">
                              <div className="bg-[#BDDDEE] px-2.5 py-1 h-6 rounded-full flex items-center justify-center shadow-sm">
                                <span className="text-gray-900 text-xs font-semibold">
                                  {subItem.badge.count}
                                </span>
                              </div>
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
                  </div>
                </section>
              ))}
            </div>
          </nav>

          <div className={cn("shrink-0 pb-3 pt-2", isSidebarCollapsed ? "px-3" : "px-5")}>
            <VersionSwitcher collapsed={isSidebarCollapsed} onOpenComponents={() => setCurrentPage('modular-components')} />
          </div>

          {/* Bottom Section - Avatar + Logout */}
          <div className={cn(
            "border-t border-border/50 transition-all duration-300",
            isSidebarCollapsed ? "px-3 py-4" : "px-6 py-6"
          )}>
            {isSidebarCollapsed ? (
              <div className="flex justify-center">
                {onLogout ? (<Button
                  variant="ghost"
                  size="sm"
                  onClick={onLogout}
                  title="Log out"
                  className="h-10 w-10 p-0 text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10 transition-all duration-200 rounded-xl"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                </Button>) : <CustomAvatar />}
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 transition-all duration-200 shadow-lg hover:shadow-xl">
                <div className="flex items-center gap-4 min-w-0">
                  <CustomAvatar />
                  <span className="text-sm font-semibold text-sidebar-foreground truncate">Johdoe1</span>
                </div>
                {onLogout && (<Button
                  variant="ghost"
                  size="sm"
                  onClick={onLogout}
                  title="Log out"
                  className="h-9 px-3 text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10 transition-all duration-200 rounded-xl shadow-sm hover:shadow-md"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4" />
                </Button>)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div 
            className={cn(
              "fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-in-out",
              isMobileMenuOpen ? "opacity-100" : "opacity-0"
            )}
            onClick={toggleMobileMenu} 
          />
          <div className={cn(
            "fixed top-0 right-0 h-full w-80 bg-white dark:bg-sidebar border-l border-border shadow-2xl transition-transform duration-300 ease-in-out",
            isMobileMenuOpen ? "transform translate-x-0" : "transform translate-x-full"
          )}>
            <div className="flex flex-col h-full">
              {/* Mobile Menu Header */}
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 flex items-center justify-center flex-shrink-0 rounded-xl shadow-md bg-[#BDDDEE]/10">
                    {/* PROTECTED MOBILE MENU LOGO - NEVER REMOVE */}
                    <ImageWithFallback 
                      src={kokoLogo} 
                      alt="Koko Logo" 
                      className="h-7 w-7 object-contain"
                    />
                  </div>
                  <h2 className="text-xl font-bold text-sidebar-foreground">Merchant Portal</h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMobileMenu}
                  className="rounded-xl hover:bg-sidebar-button-hover transition-colors duration-200"
                >
                  <XMarkIcon className="h-5 w-5" />
                </Button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 overflow-y-auto">
                <div className={iteration === '1' ? "px-5 py-3 space-y-1" : "p-6 space-y-3"}>
                  {groupedNavigation.map(group => (
                    <section key={group.id} aria-label={group.label}>
                      {group.id === 'finance' && <div role="separator" className="mx-3 my-4 border-t border-border/60" />}
                      {group.title && <button type="button" onClick={() => toggleGroup(group.id)} aria-expanded={openGroup === group.id} aria-controls={`mobile-group-${group.id}`} className={cn("flex h-11 w-full items-center gap-2.5 rounded-lg px-3 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-button-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring")}>
                        <group.icon className="h-[18px] w-[18px] shrink-0 text-sidebar-foreground/60" />
                        <span>{group.title}</span>
                        <ChevronDownIcon className={cn("ml-auto h-3.5 w-3.5 text-sidebar-foreground/60 transition-transform", openGroup === group.id && "rotate-180")} />
                      </button>}
                      <div id={`mobile-group-${group.id}`} hidden={!!group.title && openGroup !== group.id} className={cn(iteration === '1' ? "space-y-0.5" : "space-y-3", group.title && "ml-4 border-l border-border/50 pl-1")}>
                  {group.items.map((item) => (
                    <div key={item.id}>
                      <Button
                        variant="ghost"
                        className={cn(
                          "w-full justify-between text-left rounded-xl transition-all duration-200",
                          iteration === '1' ? "h-11 px-3" : "h-14 px-4",
                          currentPage === item.id && !item.hasSecondary
                            ? "sidebar-active-gradient text-[#1f2937] shadow-md"
                            : "hover:bg-sidebar-button-hover hover:shadow-md text-sidebar-foreground"
                        )}
                        aria-current={isItemActive(item) ? 'page' : undefined}
                        onClick={() => handleMobileItemClick(item)}
                      >
                        <div className={cn("flex items-center", iteration === '1' ? "gap-2.5" : "gap-4")}>
                          <item.icon className={iteration === '1' ? "h-4 w-4" : "h-5 w-5"} />
                          <span className="font-medium">{item.title}</span>
                          {shouldShowCampaignNotification(item) && (
                            <div className="h-4 w-4 text-[#BDDDEE] animate-pulse">
                              <HIconSolidBell />
                            </div>
                          )}
                          {item.badge && item.badge.count > 0 && item.id !== 'campaign' && (
                            <Badge 
                              variant={item.badge.variant || 'default'}
                              className="h-5 w-5 p-0 flex items-center justify-center text-xs min-w-[20px] bg-[#BDDDEE] text-gray-900 border-0 shadow-sm"
                            >
                              {item.badge.count > 99 ? '99+' : item.badge.count}
                            </Badge>
                          )}
                        </div>
                        {item.hasSecondary && item.id !== 'campaign' && (
                           <ChevronDownIcon 
                            className={cn(
                              "h-4 w-4 transition-transform duration-200",
                              mobileExpandedItems.has(item.id) ? "rotate-0" : "rotate-180"
                            )} 
                          />
                        )}
                      </Button>

                      {/* Mobile Secondary Items */}
                      {item.hasSecondary && mobileExpandedItems.has(item.id) && item.id !== 'campaign' && (
                        <div className="ml-8 mt-2 space-y-2">
                          {item.secondaryItems?.map((subItem) => (
                            <Button
                              key={subItem.id}
                              variant="ghost"
                              className={cn(
                                "w-full justify-between h-12 px-4 text-left text-sm rounded-xl transition-all duration-200",
                                currentPage === subItem.id
                                  ? "bg-[#BDDDEE]/20 text-sidebar-foreground border border-[#BDDDEE]/30 shadow-sm"
                                  : "hover:bg-sidebar-button-hover text-sidebar-foreground/80"
                              )}
                              onClick={() => handleSecondaryClick(subItem.id)}
                            >
                              <span className="font-medium">{subItem.title}</span>
                              {subItem.badge && subItem.badge.count > 0 && (
                                <div className="h-4 w-4 text-[#BDDDEE]">
                                  <HIconSolidBell />
                                </div>
                              )}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                      </div>
                    </section>
                  ))}
                </div>
              </nav>

              <div className="shrink-0 px-6 pb-4">
                <VersionSwitcher onOpenComponents={() => { setCurrentPage('modular-components'); setIsMobileMenuOpen(false) }} />
              </div>

              {/* Bottom Section - User */}
              <div className="border-t border-border/50 bg-sidebar dark:bg-sidebar">
                {/* User Section */}
                <MobileUserAvatar onLogout={onLogout} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-1 flex-col min-w-0 overflow-x-hidden">
        {/* Mobile Header - Only for mobile hamburger menu */}
        <div className="md:hidden flex items-center justify-between gap-4 p-6 border-b bg-white dark:bg-background flex-shrink-0 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-12 w-12 flex-shrink-0 flex items-center justify-center rounded-xl bg-white border border-sidebar-border shadow-sm overflow-hidden">
              <img
                src={kokoLogo}
                alt="Koko Logo"
                className="h-8 w-8 object-contain"
              />
            </div>
            <div className="min-w-0 space-y-1 text-left">
              <h1 className="text-xl font-bold text-foreground truncate">Merchant Portal</h1>
              <p className="text-sm font-medium text-muted-foreground truncate">{getCurrentPageTitle()}</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 flex-shrink-0 rounded-xl hover:bg-accent transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            {isMobileMenuOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </Button>
        </div>
        
        {/* Page Content */}
        <main 
          className={cn(
            "flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-8 min-w-0 relative bg-background",
            currentPage === 'create-order' && createOrderStep === 'form' && "flex items-center justify-center"
          )}
          style={shouldApplySpecialBackground ? {
            backgroundImage: theme === 'dark'
              ? 'linear-gradient(149.739deg, #1a2a38 0%, #1e2145 45%, #2a1a3a 100%)'
              : 'linear-gradient(149.739deg, #BDDCEE 0%, #E0E7FF 35%, #F3E8FF 70%, #FCE7F3 100%)',
          } : {}}
        >

          <div className={cn(
            "relative z-10",
            currentPage === 'create-order' && createOrderStep === 'form' && "w-full"
          )}>
            {children || (
            currentPage === 'create-order' ? (
              <CreateOrder formCardRef={iteration === '1' ? createOrderCardRef : undefined} onStepChange={handleCreateOrderStepChange} onNavigateToOrders={() => handleNavigateToOrders('pending')} />
            ) : currentPage === 'orders' ? (
              <Orders initialTab={ordersInitialTab} onTabChange={() => setOrdersInitialTab(null)} />
            ) : currentPage === 'static-qr' ? (
              <StaticQR />
            ) : currentPage === 'analytics' ? (
              <Analytics />
            ) : currentPage === 'koko-assets' ? (
              <KokoAssets />
            ) : currentPage === 'campaign' || currentPage === 'campaign-active' || currentPage === 'campaign-yours' ? (
              <Campaign showNotification={!campaignNotificationViewed} />
            ) : currentPage === 'plugins' ? (
              <Plugin />
            ) : currentPage === 'modular-components' && iteration === '1' ? (
              <ModularComponents onSimulateEntry={(content) => { setCurrentPage('create-order'); setCreateOrderStep('form'); setAnnouncement(content) }} onExplore={exploreAnnouncementFeature} onContinue={continueToCreateOrder} />
            ) : currentPage === 'financial-statement' && iteration === '1' ? (
              <Finance page />
            ) : currentPage === 'bank-account' && iteration === '1' ? (
              <BankAccountV1 />
            ) : currentPage === 'finance' ? (
              <FinanceWorkspace section={financeSection} onSectionChange={setFinanceSection} />
            ) : currentPage === 'merchant-loans' ? (
              <MerchantLoans page />
            ) : currentPage === 'action-history' ? (
              <ActionHistory />
            ) : currentPage === 'profile-management' ? (
              <ProfileManagement />
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center space-y-6 max-w-md p-8 rounded-2xl bg-white dark:bg-card shadow-lg border border-border/50">
                  <div className="text-center space-y-3">
                    <h1 className="text-3xl font-semibold">Create New Order</h1>
                    <p className="text-muted-foreground text-lg">
                      Generate payment links and QR codes for customers
                    </p>
                  </div>
                </div>
              </div>
            )
            )}
          </div>
        </main>
      </div>
    </div>
  )
}