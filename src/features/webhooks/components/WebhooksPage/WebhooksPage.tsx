import { useNavigate, useSearchParams } from 'react-router-dom';

import { useWebhooks } from '../../hooks/useWebhooks';
import { useAuth } from '../../../auth/hooks/useAuth';

import './WebhooksPage.css';

export default function WebhooksPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const rawPage = Number(searchParams.get('page') ?? '1');
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const search = searchParams.get('search') ?? '';

  const { data, isPending, isError, error, refetch } = useWebhooks({
    page,
    search,
  });

  const totalPages = data?.paging.pages.last ?? 1;
  const totalResults = data?.paging.results.total ?? 0;

  function updateUrl(nextPage: number, nextSearch: string) {
    const nextParams = new URLSearchParams();

    if (nextPage > 1) {
      nextParams.set('page', String(nextPage));
    }

    if (nextSearch) {
      nextParams.set('search', nextSearch);
    }

    setSearchParams(nextParams);
  }

  function handleSearchChange(value: string) {
    updateUrl(1, value);
  }

  function handlePageChange(nextPage: number) {
    updateUrl(nextPage, search);
  }

  return (
    <main className="webhooks-page">
      <header className="webhooks-page__header">
        <div>
          <h1>Webhooks</h1>
          <p>Manage your webhook endpoints.</p>
          <span className="webhooks-page__count">{totalResults} total</span>
        </div>
        <div>
          <p>Signed in as {user?.email}</p>
          <button type="button" onClick={() => void logout()}>
            Sign out
          </button>
        </div>
      </header>

      <section className="webhooks-panel" aria-label="Webhook list">
        <div className="webhooks-toolbar">
          <label className="webhooks-search">
            <span>Search by name</span>
            <input
              type="search"
              value={search}
              onChange={(event) => handleSearchChange(event.target.value)}
              placeholder="Search webhooks..."
              aria-label="Search webhooks by name"
            />
          </label>
        </div>

        {isPending ? (
          <div className="webhooks-message" role="status">
            Loading webhooks...
          </div>
        ) : isError ? (
          <div className="webhooks-message webhooks-message--error" role="alert">
            <p>{error instanceof Error ? error.message : 'Failed to load webhooks.'}</p>
            <button type="button" onClick={() => void refetch()}>
              Try again
            </button>
          </div>
        ) : data.data.length === 0 ? (
          <div className="webhooks-message">
            {search ? `No webhooks found for "${search}".` : 'No webhooks available.'}
          </div>
        ) : (
          <>
            <div className="webhooks-table-wrapper">
              <table className="webhooks-table">
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Endpoint URL</th>
                    <th scope="col">Status</th>
                    <th scope="col">Created</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {data.data.map((webhook) => (
                    <tr key={webhook.id}>
                      <td className="webhooks-table__name">{webhook.name}</td>
                      <td className="webhooks-table__url">{webhook.url}</td>
                      <td>
                        <span
                          className={`webhook-status ${
                            webhook.active ? 'webhook-status--active' : 'webhook-status--inactive'
                          }`}
                        >
                          {webhook.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>{new Date(webhook.created_at).toLocaleDateString()}</td>
                      <td>
                        <button
                          type="button"
                          onClick={() => navigate(`/webhooks/${webhook.id}/edit`)}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <footer className="webhooks-pagination">
              <span>
                Page {page} of {totalPages}
              </span>

              <div className="webhooks-pagination__controls">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => handlePageChange(page - 1)}
                >
                  Previous
                </button>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => handlePageChange(page + 1)}
                >
                  Next
                </button>
              </div>
            </footer>
          </>
        )}
      </section>
    </main>
  );
}
