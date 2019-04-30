
import { create } from 'ecs-parallel'

create(({
	createSystem,
	finished
}) => {
	const needsFoodFilter = [{
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
	}]
	createSystem({
		systemId: 'increaseHunger',
		filter: needsFoodFilter,
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
}, async ({
	createComponentCreator,
	createEntityCreator,
	createEntityFromObject,
	systems: { increaseHunger },
	dispose
}) => {
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

	aHuman.getComponent({
		componentId: 'foodAmtCurrent'
	}).observe.filter(({
		event
	}) => event == 'data-updated').subscribe(console.log)
	increaseHunger.observe.filter(({
		event
	}) => event == 'system-job-complete').subscribe(console.log)

	const go = async () => await increaseHunger.run({ entities: [ aHuman ]})
	await go()

	// const going = setInterval(go, 2000)
	// setTimeout(() => {
		// clearInterval(going)
		dispose()
	// }, 20000)
})
