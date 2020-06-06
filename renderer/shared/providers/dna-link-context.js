import React from 'react'
import {Machine, assign} from 'xstate'
import {log} from 'xstate/lib/actions'
import {useMachine} from '@xstate/react'
import {useTranslation} from 'react-i18next'
import {isValidUrl} from '../utils/dna-link'
import {useNotificationDispatch} from './notification-context'

const dnaUrlMachine = Machine(
  {
    initial: 'checking',
    states: {
      checking: {
        invoke: {
          src: () => global.ipcRenderer.invoke('CHECK_DNA_LINK'),
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
  const {addError} = useNotificationDispatch()
  const {t} = useTranslation()
  const [current, send, service] = useMachine(dnaUrlMachine, {
    actions: {
      onInvalid: () =>
        addError({
          title: t('Invalid DNA link'),
          body: t(`You must provide valid URL including protocol version`),
        }),
    },
  })
  return <DnaLinkContext.Provider value={[current, send, service]} {...props} />
}

export function useDnaLink() {
  return React.useContext(DnaLinkContext)
}
