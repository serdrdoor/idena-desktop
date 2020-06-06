import React from 'react'
import {Machine, assign} from 'xstate'
import {log} from 'xstate/lib/actions'
import {isValidUrl} from '../utils/dna-link'

const dnaUrlMachine = Machine(
  {
    initial: 'checking',
    states: {
      checking: {
        invoke: {
          src: () =>
            Promise.resolve(
              `dna://send/v1?address=0x477E32166cd16C1b4909BE783347e705Aef3d5db&amount=12388768768&comment=mycomment`
            ), // global.ipcRenderer.invoke('CHECK_DNA_LINK'),
          onDone: [
            {target: 'empty', actions: ['setUrl', log()], cond: 'isEmptyUrl'},
            {target: 'ready', actions: ['setUrl', log()], cond: 'isValidUrl'},
            'invalid',
          ],
          onError: 'failure',
        },
        onExit: log(),
      },
      ready: {
        invoke: {
          src: () => cb => {
            const handleDnaLink = (_, e) => cb('DETECT', e)
            global.ipcRenderer.on('DNA_LINK', handleDnaLink)
            return () => {
              global.ipcRenderer.removeListener('DNA_LINK', handleDnaLink)
            }
          },
        },
        on: {
          DETECT: [
            {
              target: 'empty',
              cond: 'isEmptyUrl',
            },
            {
              actions: 'setUrl',
              cond: 'isValidUrl',
            },
            'invalid',
          ],
          CLOSE: 'empty',
        },
      },
      empty: {},
      invalid: {
        entry: ['onInvalid'],
      },
      failure: {},
    },
  },
  {
    actions: {
      setUrl: assign((_, {data}) => ({url: data})),
    },
    guards: {
      isEmptyUrl: (_, {data}) => !data,
      isValidUrl: (_, {data}) => isValidUrl(data),
    },
  }
)

const DnaLinkContext = React.createContext()

// eslint-disable-next-line react/prop-types
export function DnaLinkProvider(props) {
  return <DnaLinkContext.Provider value={dnaUrlMachine} {...props} />
}

export function useDnaLink() {
  return React.useContext(DnaLinkContext)
}
