import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ContentStatus } from '../content-status';

describe('ContentStatus', () => {
  it('renders idle placeholder when status is idle', () => {
    render(
      <ContentStatus status="idle" hasContent={false}>
        <p>definition content</p>
      </ContentStatus>,
    );
    expect(screen.getByText('Look up any word')).toBeTruthy();
  });

  it('does NOT render children when status is idle', () => {
    render(
      <ContentStatus status="idle" hasContent={false}>
        <p>definition content</p>
      </ContentStatus>,
    );
    expect(screen.queryByText('definition content')).toBeNull();
  });

  it('renders error message when status is error and error prop is provided', () => {
    render(
      <ContentStatus status="error" error="Custom error message">
        <p>definition content</p>
      </ContentStatus>,
    );
    expect(screen.getByText('Custom error message')).toBeTruthy();
  });

  it('renders fallback error text when status is error and no error prop', () => {
    render(
      <ContentStatus status="error">
        <p>definition content</p>
      </ContentStatus>,
    );
    expect(screen.getByText('Failed to fetch definition. Please try again.')).toBeTruthy();
  });

  it('does NOT render children when status is error', () => {
    render(
      <ContentStatus status="error" error="Oops">
        <p>definition content</p>
      </ContentStatus>,
    );
    expect(screen.queryByText('definition content')).toBeNull();
  });

  it('renders a spinner when status is loading and hasContent is false', () => {
    const { container } = render(
      <ContentStatus status="loading" hasContent={false}>
        <p>definition content</p>
      </ContentStatus>,
    );
    expect(container.querySelector('svg')).toBeTruthy();
  });

  it('does NOT render children when loading with no content yet', () => {
    render(
      <ContentStatus status="loading" hasContent={false}>
        <p>definition content</p>
      </ContentStatus>,
    );
    expect(screen.queryByText('definition content')).toBeNull();
  });

  it('renders children when status is success', () => {
    render(
      <ContentStatus status="success" hasContent={true}>
        <p>definition content</p>
      </ContentStatus>,
    );
    expect(screen.getByText('definition content')).toBeTruthy();
  });

  it('renders children when status is loading but hasContent is true', () => {
    render(
      <ContentStatus status="loading" hasContent={true}>
        <p>streaming content</p>
      </ContentStatus>,
    );
    expect(screen.getByText('streaming content')).toBeTruthy();
  });

  it('renders children when status is success with no hasContent prop (default false)', () => {
    render(
      <ContentStatus status="success">
        <p>done</p>
      </ContentStatus>,
    );
    expect(screen.getByText('done')).toBeTruthy();
  });
});
