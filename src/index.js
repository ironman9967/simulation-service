
import { create } from 'ecs-parallel'

create(({
	createSystem,
	finished
}) => {
	createSystem({
		systemId: 'time',
		filter: [
			{ componentId: 'elapsed' },
			{ componentId: 'tick', readonly: true }
		],
		run: ({ elapsed, tick }) => new Promise(resolve => setTimeout(() =>
			resolve({ elapsed: elapsed + tick, tick }),
			tick))
	})
	createSystem({
		systemId: 'increaseHunger',
		filter: [{
			componentId: 'needsFood',
			readonly: true
		}, {
			componentId: 'needsFoodAmt',
			readonly: true
		}, {
			componentId: 'needsFoodTimeCurrent',
			readonly: true
		}, {
			componentId: 'foodAmtCurrent'
		}],
		run: ({
			needsFood,
			needsFoodAmt,
			needsFoodTimeCurrent,
			foodAmtCurrent
		}) => {
			if (needsFood && needsFoodTimeCurrent <= 0) {
				foodAmtCurrent -= needsFoodAmt
			}
			return {
				needsFood,
				needsFoodAmt,
				needsFoodTimeCurrent,
				foodAmtCurrent
			}
		}
	})
	finished()
}, ({
	createComponentCreator,
	createEntityCreator,
	createEntityFromObject,
	systems: {
		time,
		increaseHunger
	},
	dispose
}) => {
	const gameloop = createEntityFromObject({
		entityId: 'gameloop',
		obj: {
			elapsed: 0,
			tick: 500
		}
	})
	const aHuman = createEntityFromObject({
		entityId: 'human',
		obj: {
			needsFood: true,
			needsFoodAmt: 10,
			needsFoodTimeCurrent: 0,
			needsFoodTimeMax: 8,
			foodAmtCurrent: 100,
			foodAmtMax: 100
		}
	})

	const loop = async () => await time.run({ entities: [ gameloop ]})

	const { subscribe: gameloopTicked } = gameloop
		.getComponent({ componentId: 'elapsed' })
		.observe
		.filter(({ event }) => event == 'data-updated')

	gameloopTicked(() => loop())
	gameloopTicked(() => increaseHunger.run({ entities: [ aHuman ] }))

	const logSystem = system => log => system.observe
		.filter(({ event }) => event == 'run-entity-complete')
		.subscribe(({
			systemId,
			entity: { entityId },
			meta: { timing: { duration } },
			result
		}) => log({ systemId, entityId, duration, result }))

	logSystem(time)(console.log)
	logSystem(increaseHunger)(console.log)

	loop()

	setTimeout(dispose, 5000)
})
