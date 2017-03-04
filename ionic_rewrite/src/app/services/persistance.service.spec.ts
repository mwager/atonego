// TODO
/**
 * Persistance service idea & goals
 *
 *   1. service to "persist" stuff,
 *     no matter if local or remote
 *    --> BUT OFFLINE FIRST
 *   2. provide *very* easy API
 *   3. IMPORTANT: app just communicates with this service!
 *
 *   - coverage 100%
 *
 *
 * Use cases:
 *   save/edit todo
 *     1. storage it - iin the user object
 *       - persist.createOrEdit
 *       - http.get(reponse) - storage reponse
 *       -   if offline: - storage reponse with dirty
 *     2. http persist
 *
 *
 * Given offline
 *   - able to use. if user saved: ok
 *   - create/update/delete lists/todos ... locally
 *   - "sync":
 *     - local-to-remote sync wins?
 *     - "dirty" konzept? better name..
 *
 *
 */
describe('PersistanceService', () => {

  describe('#createOrEditTodo', () => {

  });
});
