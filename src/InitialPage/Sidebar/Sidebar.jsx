import React, { useState, useCallback, memo } from "react";
import PropTypes from 'prop-types';
import Scrollbars from "react-custom-scrollbars-2";
import { Link, useLocation } from "react-router-dom";
import { getSidebarData } from "../../core/json/siderbar_data";
import HorizontalSidebar from "./horizontalSidebar";
import CollapsedSidebar from "./collapsedSidebar";

// Extracted submenu item component
const SubMenuItem = memo(({ item, onClick, isOpen, currentPath }) => (
  <li className="submenu submenu-two">
    <Link
      to={item.link}
      className={currentPath === item.link ? "active" : ""}
      onClick={() => onClick(item.label)}
    >
      {item.label}
      {item.submenu && <span className="menu-arrow" />}
    </Link>
    {item.submenuItems && (
      <ul style={{ display: isOpen ? "block" : "none" }}>
        {item.submenuItems.map((subItem, index) => (
          <li key={index}>
            <Link
              to={subItem.link}
              className={`submenu-two ${currentPath === subItem.link ? "active" : ""}`}
            >
              {subItem.label}
            </Link>
          </li>
        ))}
      </ul>
    )}
  </li>
));

SubMenuItem.propTypes = {
  item: PropTypes.shape({
    link: PropTypes.string,  // Made optional
    label: PropTypes.string.isRequired,
    submenu: PropTypes.bool,
    submenuItems: PropTypes.arrayOf(
      PropTypes.shape({
        link: PropTypes.string,  // Made optional
        label: PropTypes.string.isRequired
      })
    )
  }).isRequired,
  isActive: PropTypes.bool.isRequired,
  onClick: PropTypes.func.isRequired,
  isOpen: PropTypes.bool.isRequired,
  currentPath: PropTypes.string.isRequired
};

SubMenuItem.defaultProps = {
  item: {
    link: '#',
  }
};

SubMenuItem.displayName = 'SubMenuItem';

// Main menu item component
const MenuItem = memo(({ title, isOpen, onToggle, isActive, currentSubMenu, onSubMenuToggle }) => {
  const location = useLocation();
  
  return (
    <li className={`submenu ${isActive ? 'active' : ''}`}>
      <Link
        to={title.link}
        onClick={() => onToggle(title.label)}
        className={`${isOpen ? "subdrop" : ""} ${location.pathname === title.link ? "active" : ""}`}
      >
        {title.icon}
        <span>{title.label}</span>
        {title.submenu && <span className="menu-arrow" />}
      </Link>
      {title.submenuItems && (
        <ul style={{ display: isOpen ? "block" : "none" }}>
          {title.submenuItems.map((item, index) => (
            <SubMenuItem
              key={index}
              item={item}
              isActive={isActive}
              onClick={onSubMenuToggle}
              isOpen={currentSubMenu === item.label}
              currentPath={location.pathname}
            />
          ))}
        </ul>
      )}
    </li>
  );
});

MenuItem.propTypes = {
  title: PropTypes.shape({
    link: PropTypes.string,  // Made optional
    label: PropTypes.string.isRequired,
    icon: PropTypes.node,
    submenu: PropTypes.bool,
    submenuItems: PropTypes.arrayOf(
      PropTypes.shape({
        link: PropTypes.string,  // Made optional
        label: PropTypes.string.isRequired
      })
    )
  }).isRequired,
  isOpen: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  isActive: PropTypes.bool.isRequired,
  currentSubMenu: PropTypes.string.isRequired,
  onSubMenuToggle: PropTypes.func.isRequired
};

MenuItem.defaultProps = {
  title: {
    link: '#',
  }
};

MenuItem.displayName = 'MenuItem';

const Sidebar = () => {
  const location = useLocation();
  const [activeMenu, setActiveMenu] = useState("");
  const [activeSubMenu, setActiveSubMenu] = useState("");

  const handleMenuToggle = useCallback((title) => {
    setActiveMenu(prev => prev === title ? "" : title);
  }, []);

  const handleSubMenuToggle = useCallback((subitem) => {
    setActiveSubMenu(prev => prev === subitem ? "" : subitem);
  }, []);

  const isLinkActive = useCallback((links = []) => {
    if (!Array.isArray(links)) return false;
    return links.some(link => {
      // Check if current path starts with the link path
      return location.pathname === link || location.pathname.startsWith(`${link}/`);
    });
  }, [location.pathname]);

  const sidebarData = getSidebarData();

  return (
    <div>
      <div className="sidebar" id="sidebar">
        <Scrollbars>
          <div className="sidebar-inner slimscroll">
            <div id="sidebar-menu" className="sidebar-menu">
              <ul>
                {sidebarData?.map((mainLabel, index) => (
                  <li className="submenu-open" key={index}>
                    <h6 className="submenu-hdr">{mainLabel.label}</h6>
                    <ul>
                      {mainLabel.submenuItems?.map((title, i) => {
                        const links = title.submenuItems?.flatMap(link => 
                          [
                            link.link, 
                            ...(link.submenuItems?.map(item => item.link) || [])
                          ]
                        ) || [];
                        
                        return (
                          <MenuItem
                            key={i}
                            title={title}
                            isOpen={activeMenu === title.label}
                            onToggle={handleMenuToggle}
                            isActive={Boolean(isLinkActive(links))}
                            currentSubMenu={activeSubMenu}
                            onSubMenuToggle={handleSubMenuToggle}
                          />
                        );
                      })}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Scrollbars>
      </div>
      <HorizontalSidebar />
      <CollapsedSidebar />
    </div>
  );
};

Sidebar.displayName = 'Sidebar';

export default memo(Sidebar);
