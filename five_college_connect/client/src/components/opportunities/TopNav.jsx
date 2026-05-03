import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.js'
import { resolveProfileImageUrl } from '../../lib/profileImageUrl.js'
import {
  IconBell,
  IconPlus,
  IconSearch,
  LogoCap,
} from './Icons.jsx'

// top bar shared on feed + profile (search text changes per page)
export function TopNav({
  searchPlaceholder = 'Search opportunities...',
  searchValue,
  onSearchChange,
}) {
  const { user } = useAuth()
  const avatarSrc = resolveProfileImageUrl(user?.profileImageUrl)
  const searchInputProps = onSearchChange
    ? {
        value: searchValue ?? '',
        onChange: onSearchChange,
      }
    : {}

  return (
    <header className="fcc-topnav">
      <div className="fcc-topnav__left">
        <Link className="fcc-brand" to="/opportunities" aria-label="Five College Connect home">
          <LogoCap />
          <span className="fcc-brand__text">Five College Connect</span>
        </Link>
      </div>

      {/* center search is only visual until we wire elasticsearch or whatever */}
      <div className="fcc-topnav__search-wrap">
        <label className="fcc-search" htmlFor="opp-search">
          <span className="fcc-search__icon">
            <IconSearch />
          </span>
          <input
            id="opp-search"
            type="search"
            className="fcc-search__input"
            placeholder={searchPlaceholder}
            autoComplete="off"
            {...searchInputProps}
          />
        </label>
      </div>

      <div className="fcc-topnav__right">
        <Link to="/postings/new" className="fcc-btn fcc-btn--primary">
          <IconPlus />
          Create Posting
        </Link>
        <button type="button" className="fcc-icon-btn" aria-label="Notifications">
          <IconBell />
        </button>
        <Link
          to="/profile"
          className="fcc-avatar"
          aria-label="My profile"
        >
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt=""
              className="fcc-avatar__img"
              decoding="async"
            />
          ) : (
            <span className="fcc-avatar__placeholder" />
          )}
        </Link>
      </div>
    </header>
  )
}
